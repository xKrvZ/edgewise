import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ROLES, hasRole } from '@/auth/constants/roles.constants';
import { StorageService } from '@/modules/storage/storage.service';
import {
  DELETE_ACCOUNT_CONFIRMATION,
} from '../constants/privacy.constants';
import { AccountDeletionDao } from '../daos/account-deletion.dao';
import { PrivacyUserDao } from '../daos/privacy-user.dao';
import { isDeletedUserRecord } from '../utils/sanitize-user.util';

/**
 * Right-to-erasure flow for Edgewise accounts.
 *
 * Erased: trades, journal, screenshots (S3 + DB), playbooks, tags, communities
 * owned by the user, comments, notifications, profile media, and auth credentials.
 *
 * Retained for billing reconciliation (user row is pseudonymized, not removed):
 * - `user_subscription` (polarCustomerId, subscription status)
 * - `platform_event` rows (append-only billing/audit history)
 * - Polar customer and orders are NOT deleted via API (manage in Polar dashboard).
 */
@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  constructor(
    private readonly accountDeletionDao: AccountDeletionDao,
    private readonly privacyUserDao: PrivacyUserDao,
    private readonly storage: StorageService,
  ) {}

  async deleteAccount(userId: string, confirmation: string): Promise<void> {
    const user = await this.accountDeletionDao.findUserForDeletion(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (isDeletedUserRecord(user)) {
      throw new BadRequestException('This account has already been deleted');
    }

    const normalizedConfirmation = confirmation.trim();
    const emailMatches =
      normalizedConfirmation.toLowerCase() === user.email.toLowerCase();
    const phraseMatches =
      normalizedConfirmation === DELETE_ACCOUNT_CONFIRMATION;

    if (!emailMatches && !phraseMatches) {
      throw new BadRequestException(
        `Confirmation must be your email or "${DELETE_ACCOUNT_CONFIRMATION}"`,
      );
    }

    if (hasRole(user.role, ROLES.ADMINISTRATOR)) {
      const otherAdmins = await this.privacyUserDao.countAdministrators(userId);
      if (otherAdmins === 0) {
        throw new BadRequestException(
          'Cannot delete the last administrator account. Promote another admin first.',
        );
      }
    }

    await this.accountDeletionDao.markDeletionRequested(userId);

    const [screenshotKeys, profileKeys] = await Promise.all([
      this.accountDeletionDao.listScreenshotStorageKeys(userId),
      this.accountDeletionDao.findProfileStorageKeys(userId),
    ]);

    const mediaKeys = [
      ...screenshotKeys,
      profileKeys?.avatarStorageKey,
      profileKeys?.headerStorageKey,
    ].filter((key): key is string => typeof key === 'string' && key.length > 0);

    await this.deleteMediaKeys(mediaKeys);
    await this.accountDeletionDao.deleteDomainData(userId);
    await this.accountDeletionDao.revokeAuthCredentials(userId, user.email);
    await this.accountDeletionDao.anonymizeUser(userId);
  }

  private async deleteMediaKeys(keys: string[]): Promise<void> {
    for (const key of keys) {
      try {
        await this.storage.deleteObject(key);
      } catch (error) {
        this.logger.warn(`Failed to delete object ${key} during account erasure`, error as Error);
      }
    }
  }
}
