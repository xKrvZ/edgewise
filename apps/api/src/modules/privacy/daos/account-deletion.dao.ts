import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { DB } from '@/database/types/db';
import { ANONYMIZED_EMAIL_DOMAIN, DELETED_USER_DISPLAY_NAME } from '../constants/privacy.constants';

export interface UserDeletionRecord {
  id: string;
  email: string;
  role: string | null;
  deletedAt: Date | null;
  anonymizedAt: Date | null;
}

@Injectable()
export class AccountDeletionDao extends KyselyDao<AccountDeletionDao> {
  static readonly USER_TABLE = 'user' as keyof DB;

  async findUserForDeletion(userId: string): Promise<UserDeletionRecord | null> {
    const row = await this.kysely
      .selectFrom(AccountDeletionDao.USER_TABLE)
      .select(['id', 'email', 'role', 'deletedAt', 'anonymizedAt'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!row?.id) {
      return null;
    }

    return {
      id: String(row.id),
      email: String(row.email),
      role: row.role ?? null,
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
      anonymizedAt: row.anonymizedAt ? new Date(row.anonymizedAt) : null,
    };
  }

  async listScreenshotStorageKeys(userId: string): Promise<string[]> {
    const rows = await this.kysely
      .selectFrom('screenshot')
      .select('storageKey')
      .where('userId', '=', userId)
      .where('storageKey', 'is not', null)
      .execute();

    return rows
      .map((row) => row.storageKey)
      .filter((key): key is string => typeof key === 'string' && key.length > 0);
  }

  async findProfileStorageKeys(
    userId: string,
  ): Promise<{ avatarStorageKey: string | null; headerStorageKey: string | null } | null> {
    const row = await this.kysely
      .selectFrom('trader_profile')
      .select(['avatarStorageKey', 'headerStorageKey'])
      .where('userId', '=', userId)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return {
      avatarStorageKey: row.avatarStorageKey ?? null,
      headerStorageKey: row.headerStorageKey ?? null,
    };
  }

  async revokeAuthCredentials(userId: string, userEmail: string): Promise<void> {
    await this.kysely.deleteFrom('session').where('userId', '=', userId).execute();
    await this.kysely.deleteFrom('account').where('userId', '=', userId).execute();
    await this.kysely
      .deleteFrom('oauthAccessToken')
      .where('userId', '=', userId)
      .execute();
    await this.kysely
      .deleteFrom('oauthRefreshToken')
      .where('userId', '=', userId)
      .execute();
    await this.kysely.deleteFrom('oauthConsent').where('userId', '=', userId).execute();
    await this.kysely
      .deleteFrom('verification')
      .where('identifier', '=', userEmail)
      .execute();
  }

  async deleteDomainData(userId: string): Promise<void> {
    await this.transaction(async (trx) => {
      const dao = this.transacting(trx);

      await dao.kysely
        .deleteFrom('notification')
        .where((eb) =>
          eb.or([eb('userId', '=', userId), eb('actorId', '=', userId)]),
        )
        .execute();

      await dao.kysely.deleteFrom('comment').where('authorId', '=', userId).execute();
      await dao.kysely.deleteFrom('community').where('createdBy', '=', userId).execute();
      await dao.kysely
        .deleteFrom('community_member')
        .where('userId', '=', userId)
        .execute();
      await dao.kysely
        .deleteFrom('community_invitation')
        .where((eb) =>
          eb.or([
            eb('invitedBy', '=', userId),
            eb('inviteeUserId', '=', userId),
          ]),
        )
        .execute();

      const tradeIds = await dao.kysely
        .selectFrom('trade')
        .select('id')
        .where('userId', '=', userId)
        .execute();
      if (tradeIds.length > 0) {
        const ids = tradeIds.map((row) => row.id);
        await dao.kysely.deleteFrom('trade_mistake').where('tradeId', 'in', ids).execute();
        await dao.kysely.deleteFrom('trade_tag').where('tradeId', 'in', ids).execute();
        await dao.kysely
          .deleteFrom('journal_entry_trade')
          .where('tradeId', 'in', ids)
          .execute();
      }

      const journalIds = await dao.kysely
        .selectFrom('journal_entry')
        .select('id')
        .where('userId', '=', userId)
        .execute();
      if (journalIds.length > 0) {
        const ids = journalIds.map((row) => row.id);
        await dao.kysely
          .deleteFrom('journal_entry_trade')
          .where('journalEntryId', 'in', ids)
          .execute();
      }

      await dao.kysely.deleteFrom('screenshot').where('userId', '=', userId).execute();
      await dao.kysely.deleteFrom('trade').where('userId', '=', userId).execute();
      await dao.kysely.deleteFrom('journal_entry').where('userId', '=', userId).execute();

      const playbookIds = await dao.kysely
        .selectFrom('playbook')
        .select('id')
        .where('userId', '=', userId)
        .execute();
      if (playbookIds.length > 0) {
        const ids = playbookIds.map((row) => row.id);
        await dao.kysely
          .deleteFrom('playbook_checklist_item')
          .where('playbookId', 'in', ids)
          .execute();
      }

      await dao.kysely
        .deleteFrom('trader_profile_playbook')
        .where('userId', '=', userId)
        .execute();
      await dao.kysely.deleteFrom('playbook').where('userId', '=', userId).execute();
      await dao.kysely.deleteFrom('backtest_trade').where('userId', '=', userId).execute();
      await dao.kysely.deleteFrom('backtest').where('userId', '=', userId).execute();
      await dao.kysely.deleteFrom('tag').where('userId', '=', userId).execute();
      await dao.kysely.deleteFrom('mistake').where('userId', '=', userId).execute();
      await dao.kysely.deleteFrom('trading_session').where('userId', '=', userId).execute();
      await dao.kysely.deleteFrom('trading_account').where('userId', '=', userId).execute();
      await dao.kysely.deleteFrom('trader_profile').where('userId', '=', userId).execute();
    });
  }

  async anonymizeUser(userId: string): Promise<void> {
    const anonymizedEmail = `deleted+${userId}${ANONYMIZED_EMAIL_DOMAIN}`;
    const now = new Date();

    await this.kysely
      .updateTable(AccountDeletionDao.USER_TABLE)
      .set({
        email: anonymizedEmail,
        name: DELETED_USER_DISPLAY_NAME,
        image: null,
        role: null,
        banned: false,
        banReason: null,
        banExpires: null,
        emailVerified: false,
        deletedAt: now,
        anonymizedAt: now,
        updatedAt: now,
      })
      .where('id', '=', userId)
      .execute();
  }

  async markDeletionRequested(userId: string): Promise<void> {
    const now = new Date();
    await this.kysely
      .updateTable(AccountDeletionDao.USER_TABLE)
      .set({
        deletionRequestedAt: now,
        updatedAt: now,
      })
      .where('id', '=', userId)
      .execute();
  }
}
