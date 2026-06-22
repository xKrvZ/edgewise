import { Injectable } from '@nestjs/common';
import { sql, type Insertable, type Selectable, type Updateable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { TradingAccount } from '@/database/types/db';

/**
 * Data access for trading accounts. Returns data or null; never throws and
 * never contains business logic.
 */
@Injectable()
export class AccountDao extends KyselyDao<AccountDao> {
  static readonly TABLE = 'trading_account' as const;

  async findAllByUser(userId: string): Promise<Selectable<TradingAccount>[]> {
    return this.kysely
      .selectFrom(AccountDao.TABLE)
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('createdAt', 'desc')
      .execute();
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<Selectable<TradingAccount> | null> {
    const row = await this.kysely
      .selectFrom(AccountDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  async create(
    data: Insertable<TradingAccount>,
  ): Promise<Selectable<TradingAccount> | null> {
    const row = await this.kysely
      .insertInto(AccountDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async updateForUser(
    id: string,
    userId: string,
    data: Updateable<TradingAccount>,
  ): Promise<Selectable<TradingAccount> | null> {
    const row = await this.kysely
      .updateTable(AccountDao.TABLE)
      .set({ ...data, updatedAt: sql`now()` })
      .where('id', '=', id)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async countByUser(userId: string): Promise<number> {
    const row = await this.kysely
      .selectFrom(AccountDao.TABLE)
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('userId', '=', userId)
      .executeTakeFirst();
    return Number(row?.count ?? 0);
  }

  async listScreenshotStorageKeysForAccount(
    accountId: string,
    userId: string,
  ): Promise<string[]> {
    const rows = await this.kysely
      .selectFrom('screenshot')
      .innerJoin('trade', 'trade.id', 'screenshot.tradeId')
      .select('screenshot.storageKey')
      .where('trade.accountId', '=', accountId)
      .where('trade.userId', '=', userId)
      .where('screenshot.storageKey', 'is not', null)
      .execute();

    return rows
      .map((row) => row.storageKey)
      .filter((key): key is string => typeof key === 'string' && key.length > 0);
  }

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(AccountDao.TABLE)
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
