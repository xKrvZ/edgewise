import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable, Updateable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { CommunityTag } from '@/database/types/db';

@Injectable()
export class CommunityTagDao extends KyselyDao<CommunityTagDao> {
  static readonly TABLE = 'community_tag' as const;

  async findByCommunity(communityId: string): Promise<Selectable<CommunityTag>[]> {
    return this.kysely
      .selectFrom(CommunityTagDao.TABLE)
      .selectAll()
      .where('communityId', '=', communityId)
      .orderBy('name', 'asc')
      .execute();
  }

  async findByIdInCommunity(
    id: string,
    communityId: string,
  ): Promise<Selectable<CommunityTag> | null> {
    const row = await this.kysely
      .selectFrom(CommunityTagDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .where('communityId', '=', communityId)
      .executeTakeFirst();
    return row ?? null;
  }

  async create(data: Insertable<CommunityTag>): Promise<Selectable<CommunityTag> | null> {
    const row = await this.kysely
      .insertInto(CommunityTagDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async updateInCommunity(
    id: string,
    communityId: string,
    data: Updateable<CommunityTag>,
  ): Promise<Selectable<CommunityTag> | null> {
    const row = await this.kysely
      .updateTable(CommunityTagDao.TABLE)
      .set(data)
      .where('id', '=', id)
      .where('communityId', '=', communityId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async deleteInCommunity(id: string, communityId: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(CommunityTagDao.TABLE)
      .where('id', '=', id)
      .where('communityId', '=', communityId)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
