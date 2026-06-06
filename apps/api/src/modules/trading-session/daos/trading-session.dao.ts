import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable, Updateable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { TradingSession } from '@/database/types/db';

@Injectable()
export class TradingSessionDao extends KyselyDao<TradingSessionDao> {
  static readonly TABLE = 'trading_session' as const;

  async findAllByUser(userId: string): Promise<Selectable<TradingSession>[]> {
    return this.kysely
      .selectFrom(TradingSessionDao.TABLE)
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('startTime', 'asc')
      .execute();
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<Selectable<TradingSession> | null> {
    const row = await this.kysely
      .selectFrom(TradingSessionDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  async create(
    data: Insertable<TradingSession>,
  ): Promise<Selectable<TradingSession> | null> {
    const row = await this.kysely
      .insertInto(TradingSessionDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async updateForUser(
    id: string,
    userId: string,
    data: Updateable<TradingSession>,
  ): Promise<Selectable<TradingSession> | null> {
    const row = await this.kysely
      .updateTable(TradingSessionDao.TABLE)
      .set(data)
      .where('id', '=', id)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(TradingSessionDao.TABLE)
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
