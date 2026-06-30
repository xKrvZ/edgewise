import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AnalyticsCacheService } from '@/modules/analytics/cache/analytics-cache.service';
import { AccountLimitService } from '@/modules/billing/services/account-limit.service';
import { StorageService } from '@/modules/storage/storage.service';
import { AccountDao } from '../daos/account.dao';
import { type AccountDto, toAccountDto } from '../dtos/account.dto';
import type { CreateAccountDto } from '../dtos/create-account.dto';
import type { UpdateAccountDto } from '../dtos/update-account.dto';

/**
 * Trading account lifecycle.
 *
 * Deletion cascade order (DB FKs + explicit S3 cleanup):
 * 1. S3 objects for screenshots linked to trades on this account
 * 2. `trading_account` row delete triggers:
 *    - `trade` (ON DELETE CASCADE)
 *      - `trade_tag`, `trade_mistake`, `journal_entry_trade` (CASCADE)
 *      - `screenshot` rows with tradeId (CASCADE)
 * 3. Analytics cache invalidation for the user
 *
 * User-scoped entities (journal entries, playbooks, backtests, tags, etc.)
 * are not tied to a trading account and are preserved.
 */
@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly accountDao: AccountDao,
    private readonly accountLimitService: AccountLimitService,
    private readonly storage: StorageService,
    private readonly analyticsCache: AnalyticsCacheService,
  ) {}

  async list(userId: string): Promise<AccountDto[]> {
    const rows = await this.accountDao.findAllByUser(userId);
    return rows.map(toAccountDto);
  }

  async countByUser(userId: string): Promise<number> {
    return this.accountDao.countByUser(userId);
  }

  async getById(id: string, userId: string): Promise<AccountDto> {
    const row = await this.accountDao.findByIdForUser(id, userId);
    if (!row) {
      throw new NotFoundException(`Account ${id} not found`);
    }
    return toAccountDto(row);
  }

  async create(
    userId: string,
    dto: CreateAccountDto,
    email?: string | null,
  ): Promise<AccountDto> {
    const accountCount = await this.accountDao.countByUser(userId);
    await this.accountLimitService.assertCanCreate(userId, accountCount, email);

    const row = await this.accountDao.create({
      userId,
      name: dto.name,
      broker: dto.broker ?? null,
      type: dto.type ?? 'live',
      currency: dto.currency ?? 'USD',
      startingBalance: dto.startingBalance ?? 0,
      currentBalance: dto.currentBalance ?? dto.startingBalance ?? 0,
      isArchived: dto.isArchived ?? false,
      firmName: dto.firmName ?? null,
      profitTarget: dto.profitTarget ?? null,
      dailyLossLimit: dto.dailyLossLimit ?? null,
      maxLossLimit: dto.maxLossLimit ?? null,
      trailingDrawdown: dto.trailingDrawdown ?? false,
      challengeStatus: dto.challengeStatus ?? null,
      challengeStartedAt: dto.challengeStartedAt ? new Date(dto.challengeStartedAt) : null,
    });
    if (!row) {
      throw new NotFoundException('Failed to create account');
    }
    return toAccountDto(row);
  }

  async update(id: string, userId: string, dto: UpdateAccountDto): Promise<AccountDto> {
    const { challengeStartedAt, ...rest } = dto;
    const row = await this.accountDao.updateForUser(id, userId, {
      ...rest,
      ...(challengeStartedAt !== undefined && {
        challengeStartedAt: challengeStartedAt ? new Date(challengeStartedAt) : null,
      }),
    });
    if (!row) {
      throw new NotFoundException(`Account ${id} not found`);
    }
    return toAccountDto(row);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.accountDao.findByIdForUser(id, userId);
    if (!existing) {
      throw new NotFoundException(`Account ${id} not found`);
    }

    const accountCount = await this.accountDao.countByUser(userId);
    if (accountCount <= 1) {
      throw new BadRequestException(
        'Cannot delete your only trading account. Create another account first, or delete your user account from account settings.',
      );
    }

    const storageKeys = await this.accountDao.listScreenshotStorageKeysForAccount(id, userId);
    await this.deleteMediaKeys(storageKeys);

    const deleted = await this.accountDao.deleteForUser(id, userId);
    if (!deleted) {
      throw new NotFoundException(`Account ${id} not found`);
    }

    await this.analyticsCache.invalidateUser(userId);
  }

  private async deleteMediaKeys(keys: string[]): Promise<void> {
    for (const key of keys) {
      try {
        await this.storage.deleteObject(key);
      } catch (error) {
        this.logger.warn(
          `Failed to delete object ${key} during trading account removal`,
          error as Error,
        );
      }
    }
  }
}
