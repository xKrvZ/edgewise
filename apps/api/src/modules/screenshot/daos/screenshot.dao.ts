import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable, Updateable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { Screenshot } from '@/database/types/db';

@Injectable()
export class ScreenshotDao extends KyselyDao<ScreenshotDao> {
  static readonly TABLE = 'screenshot' as const;

  async findAllByUser(
    userId: string,
    filters: { tradeId?: string; playbookId?: string } = {},
  ): Promise<Selectable<Screenshot>[]> {
    let query = this.kysely
      .selectFrom(ScreenshotDao.TABLE)
      .selectAll()
      .where('userId', '=', userId);

    if (filters.tradeId) {
      query = query.where('tradeId', '=', filters.tradeId);
    }
    if (filters.playbookId) {
      query = query.where('playbookId', '=', filters.playbookId);
    }

    return query.orderBy('createdAt', 'desc').execute();
  }

  async findByTradeId(tradeId: string): Promise<Selectable<Screenshot>[]> {
    return this.kysely
      .selectFrom(ScreenshotDao.TABLE)
      .selectAll()
      .where('tradeId', '=', tradeId)
      .orderBy('createdAt', 'asc')
      .execute();
  }

  async findPublicByTradeId(tradeId: string): Promise<Selectable<Screenshot>[]> {
    return this.kysely
      .selectFrom(ScreenshotDao.TABLE)
      .selectAll()
      .where('tradeId', '=', tradeId)
      .where('visibility', '=', 'public')
      .orderBy('createdAt', 'asc')
      .execute();
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<Selectable<Screenshot> | null> {
    const row = await this.kysely
      .selectFrom(ScreenshotDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  async create(
    data: Insertable<Screenshot>,
  ): Promise<Selectable<Screenshot> | null> {
    const row = await this.kysely
      .insertInto(ScreenshotDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async updateForUser(
    id: string,
    userId: string,
    data: Updateable<Screenshot>,
  ): Promise<Selectable<Screenshot> | null> {
    const row = await this.kysely
      .updateTable(ScreenshotDao.TABLE)
      .set(data)
      .where('id', '=', id)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(ScreenshotDao.TABLE)
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
