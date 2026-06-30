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

  async findShareSummaryByUserId(userId: string): Promise<{
    displayName: string | null;
    avatarStorageKey: string | null;
    headerStorageKey: string | null;
    statsVisibility: string;
    statsShareToken: string | null;
    userName: string | null;
    userEmail: string | null;
    userImage: string | null;
  } | null> {
    const row = await this.kysely
      .selectFrom('user')
      .leftJoin(
        TraderProfileDao.TABLE,
        `${TraderProfileDao.TABLE}.userId`,
        'user.id',
      )
      .select([
        `${TraderProfileDao.TABLE}.displayName as displayName`,
        `${TraderProfileDao.TABLE}.avatarStorageKey as avatarStorageKey`,
        `${TraderProfileDao.TABLE}.headerStorageKey as headerStorageKey`,
        `${TraderProfileDao.TABLE}.statsVisibility as statsVisibility`,
        `${TraderProfileDao.TABLE}.statsShareToken as statsShareToken`,
        'user.name as userName',
        'user.email as userEmail',
        'user.image as userImage',
      ])
      .where('user.id', '=', userId)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return {
      displayName: row.displayName ?? null,
      avatarStorageKey: row.avatarStorageKey ?? null,
      headerStorageKey: row.headerStorageKey ?? null,
      statsVisibility: row.statsVisibility ?? 'private',
      statsShareToken: row.statsShareToken ?? null,
      userName: row.userName ?? null,
      userEmail: row.userEmail ?? null,
      userImage: row.userImage ?? null,
    };
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
