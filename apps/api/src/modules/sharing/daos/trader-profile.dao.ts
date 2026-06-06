import { Injectable } from '@nestjs/common';
import { sql, type Insertable, type Selectable, type Updateable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { TraderProfile } from '@/database/types/db';

@Injectable()
export class TraderProfileDao extends KyselyDao<TraderProfileDao> {
  static readonly TABLE = 'trader_profile' as const;

  async findByUserId(
    userId: string,
  ): Promise<Selectable<TraderProfile> | null> {
    const row = await this.kysely
      .selectFrom(TraderProfileDao.TABLE)
      .selectAll()
      .where('userId', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  async findByStatsShareToken(
    token: string,
  ): Promise<Selectable<TraderProfile> | null> {
    const row = await this.kysely
      .selectFrom(TraderProfileDao.TABLE)
      .selectAll()
      .where('statsShareToken', '=', token)
      .where('statsVisibility', '=', 'public')
      .executeTakeFirst();
    return row ?? null;
  }

  async findByShareToken(
    token: string,
  ): Promise<Selectable<TraderProfile> | null> {
    const row = await this.kysely
      .selectFrom(TraderProfileDao.TABLE)
      .selectAll()
      .where('statsShareToken', '=', token)
      .executeTakeFirst();
    return row ?? null;
  }

  async create(
    data: Insertable<TraderProfile>,
  ): Promise<Selectable<TraderProfile> | null> {
    const row = await this.kysely
      .insertInto(TraderProfileDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async updateForUser(
    userId: string,
    data: Updateable<TraderProfile>,
  ): Promise<Selectable<TraderProfile> | null> {
    const row = await this.kysely
      .updateTable(TraderProfileDao.TABLE)
      .set({ ...data, updatedAt: sql`now()` })
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }
}
