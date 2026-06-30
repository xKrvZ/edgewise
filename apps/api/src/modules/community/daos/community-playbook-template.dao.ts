import { Injectable } from '@nestjs/common';
import { sql, type Insertable, type Selectable, type Updateable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { CommunityPlaybookTemplate } from '@/database/types/db';
import type { CommunityPlaybookTemplateVisibility } from '../constants/community.constants';

export interface FindCommunityPlaybookTemplatesOptions {
  visibility?: CommunityPlaybookTemplateVisibility;
  includeDeleted?: boolean;
}

@Injectable()
export class CommunityPlaybookTemplateDao extends KyselyDao<CommunityPlaybookTemplateDao> {
  static readonly TABLE = 'community_playbook_template' as const;

  async findByCommunity(
    communityId: string,
    options?: FindCommunityPlaybookTemplatesOptions,
  ): Promise<Selectable<CommunityPlaybookTemplate>[]> {
    let query = this.kysely
      .selectFrom(CommunityPlaybookTemplateDao.TABLE)
      .selectAll()
      .where('communityId', '=', communityId);

    if (options?.visibility) {
      query = query.where('visibility', '=', options.visibility);
    }
    if (!options?.includeDeleted) {
      query = query.where('deletedAt', 'is', null);
    }

    return query.orderBy('name', 'asc').execute();
  }

  async findByIdInCommunity(
    id: string,
    communityId: string,
  ): Promise<Selectable<CommunityPlaybookTemplate> | null> {
    const row = await this.kysely
      .selectFrom(CommunityPlaybookTemplateDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .where('communityId', '=', communityId)
      .executeTakeFirst();
    return row ?? null;
  }

  async create(
    data: Insertable<CommunityPlaybookTemplate>,
  ): Promise<Selectable<CommunityPlaybookTemplate> | null> {
    const row = await this.kysely
      .insertInto(CommunityPlaybookTemplateDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async updateInCommunity(
    id: string,
    communityId: string,
    data: Updateable<CommunityPlaybookTemplate>,
  ): Promise<Selectable<CommunityPlaybookTemplate> | null> {
    const row = await this.kysely
      .updateTable(CommunityPlaybookTemplateDao.TABLE)
      .set({ ...data, updatedAt: sql`now()` })
      .where('id', '=', id)
      .where('communityId', '=', communityId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async softDeleteInCommunity(id: string, communityId: string): Promise<boolean> {
    const result = await this.kysely
      .updateTable(CommunityPlaybookTemplateDao.TABLE)
      .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
      .where('id', '=', id)
      .where('communityId', '=', communityId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0) > 0;
  }
}
