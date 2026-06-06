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

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(AccountDao.TABLE)
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
