import { Injectable } from '@nestjs/common';
import { sql, type Insertable, type Selectable, type Updateable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { Backtest } from '@/database/types/db';

@Injectable()
export class BacktestDao extends KyselyDao<BacktestDao> {
  static readonly TABLE = 'backtest' as const;

  async findAllByUser(userId: string): Promise<Selectable<Backtest>[]> {
    return this.kysely
      .selectFrom(BacktestDao.TABLE)
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('createdAt', 'desc')
      .execute();
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<Selectable<Backtest> | null> {
    const row = await this.kysely
      .selectFrom(BacktestDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  async create(
    data: Insertable<Backtest>,
  ): Promise<Selectable<Backtest> | null> {
    const row = await this.kysely
      .insertInto(BacktestDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async updateForUser(
    id: string,
    userId: string,
    data: Updateable<Backtest>,
  ): Promise<Selectable<Backtest> | null> {
    const row = await this.kysely
      .updateTable(BacktestDao.TABLE)
      .set({ ...data, updatedAt: sql`now()` })
      .where('id', '=', id)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(BacktestDao.TABLE)
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
