import { Injectable } from '@nestjs/common';
import { sql, type Insertable, type Selectable, type Updateable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { Community } from '@/database/types/db';

@Injectable()
export class CommunityDao extends KyselyDao<CommunityDao> {
  static readonly TABLE = 'community' as const;

  async findById(id: string): Promise<Selectable<Community> | null> {
    const row = await this.kysely
      .selectFrom(CommunityDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ?? null;
  }

  async findAllForMember(userId: string): Promise<
    (Selectable<Community> & { memberRole: string; memberCount: number })[]
  > {
    const rows = await this.kysely
      .selectFrom(CommunityDao.TABLE)
      .innerJoin('community_member', 'community_member.communityId', 'community.id')
      .selectAll('community')
      .select(['community_member.role as memberRole'])
      .select((eb) =>
        eb
          .selectFrom('community_member as cm')
          .select((eb2) => eb2.fn.count<number>('cm.id').as('count'))
          .whereRef('cm.communityId', '=', 'community.id')
          .as('memberCount'),
      )
      .where('community_member.userId', '=', userId)
      .orderBy('community.updatedAt', 'desc')
      .execute();

    return rows.map((row) => ({
      ...row,
      memberCount: Number(row.memberCount ?? 0),
    }));
  }

  async findAllWithMembership(userId: string): Promise<
    (Selectable<Community> & { memberRole: string | null; memberCount: number })[]
  > {
    const rows = await this.kysely
      .selectFrom(CommunityDao.TABLE)
      .leftJoin('community_member', (join) =>
        join
          .onRef('community_member.communityId', '=', 'community.id')
          .on('community_member.userId', '=', userId),
      )
      .selectAll('community')
      .select(['community_member.role as memberRole'])
      .select((eb) =>
        eb
          .selectFrom('community_member as cm')
          .select((eb2) => eb2.fn.count<number>('cm.id').as('count'))
          .whereRef('cm.communityId', '=', 'community.id')
          .as('memberCount'),
      )
      .orderBy('community.updatedAt', 'desc')
      .execute();

    return rows.map((row) => ({
      ...row,
      memberRole: row.memberRole ?? null,
      memberCount: Number(row.memberCount ?? 0),
    }));
  }

  async create(
    data: Insertable<Community>,
  ): Promise<Selectable<Community> | null> {
    const row = await this.kysely
      .insertInto(CommunityDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async update(
    id: string,
    data: Updateable<Community>,
  ): Promise<Selectable<Community> | null> {
    const row = await this.kysely
      .updateTable(CommunityDao.TABLE)
      .set({ ...data, updatedAt: sql`now()` })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(CommunityDao.TABLE)
      .where('id', '=', id)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
