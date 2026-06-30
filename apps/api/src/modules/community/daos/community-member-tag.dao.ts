import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { CommunityTag } from '@/database/types/db';
import type { Selectable } from 'kysely';

export interface MemberTagRow {
  communityMemberId: string;
  tag: Selectable<CommunityTag>;
}

@Injectable()
export class CommunityMemberTagDao extends KyselyDao<CommunityMemberTagDao> {
  static readonly TABLE = 'community_member_tag' as const;

  async findTagsByMemberIds(memberIds: string[]): Promise<MemberTagRow[]> {
    if (memberIds.length === 0) {
      return [];
    }

    const rows = await this.kysely
      .selectFrom(`${CommunityMemberTagDao.TABLE} as cmt`)
      .innerJoin('community_tag as ct', 'ct.id', 'cmt.tagId')
      .select([
        'cmt.communityMemberId as communityMemberId',
        'ct.id as id',
        'ct.communityId as communityId',
        'ct.name as name',
        'ct.color as color',
        'ct.createdBy as createdBy',
        'ct.createdAt as createdAt',
      ])
      .where('cmt.communityMemberId', 'in', memberIds)
      .orderBy('ct.name', 'asc')
      .execute();

    return rows.map((row) => ({
      communityMemberId: row.communityMemberId,
      tag: {
        id: row.id,
        communityId: row.communityId,
        name: row.name,
        color: row.color,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
      },
    }));
  }

  async replaceMemberTags(communityMemberId: string, tagIds: string[]): Promise<void> {
    await this.kysely
      .deleteFrom(CommunityMemberTagDao.TABLE)
      .where('communityMemberId', '=', communityMemberId)
      .execute();

    if (tagIds.length === 0) {
      return;
    }

    await this.kysely
      .insertInto(CommunityMemberTagDao.TABLE)
      .values(tagIds.map((tagId) => ({ communityMemberId, tagId })))
      .execute();
  }
}
