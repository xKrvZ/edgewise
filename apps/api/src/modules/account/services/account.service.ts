import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountDao } from '../daos/account.dao';
import { type AccountDto, toAccountDto } from '../dtos/account.dto';
import type { CreateAccountDto } from '../dtos/create-account.dto';
import type { UpdateAccountDto } from '../dtos/update-account.dto';

@Injectable()
export class AccountService {
  constructor(private readonly accountDao: AccountDao) {}

  async list(userId: string): Promise<AccountDto[]> {
    const rows = await this.accountDao.findAllByUser(userId);
    return rows.map(toAccountDto);
  }

  async getById(id: string, userId: string): Promise<AccountDto> {
    const row = await this.accountDao.findByIdForUser(id, userId);
    if (!row) {
      throw new NotFoundException(`Account ${id} not found`);
    }
    return toAccountDto(row);
  }

  async create(userId: string, dto: CreateAccountDto): Promise<AccountDto> {
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
      daysTraded: dto.daysTraded ?? 0,
      breakevenRange: dto.breakevenRange ?? 0,
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
    const deleted = await this.accountDao.deleteForUser(id, userId);
    if (!deleted) {
      throw new NotFoundException(`Account ${id} not found`);
    }
  }
}
