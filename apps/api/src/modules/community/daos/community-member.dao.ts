import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { CommunityMember } from '@/database/types/db';

export interface MemberWithProfile {
  id: string;
  communityId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  displayName: string;
  userName: string | null;
}

@Injectable()
export class CommunityMemberDao extends KyselyDao<CommunityMemberDao> {
  static readonly TABLE = 'community_member' as const;

  async findMembership(
    communityId: string,
    userId: string,
  ): Promise<Selectable<CommunityMember> | null> {
    const row = await this.kysely
      .selectFrom(CommunityMemberDao.TABLE)
      .selectAll()
      .where('communityId', '=', communityId)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  async countByCommunity(communityId: string): Promise<number> {
    const row = await this.kysely
      .selectFrom(CommunityMemberDao.TABLE)
      .select((eb) => eb.fn.count<number>('id').as('count'))
      .where('communityId', '=', communityId)
      .executeTakeFirst();
    return Number(row?.count ?? 0);
  }

  async findMembersWithProfiles(communityId: string): Promise<MemberWithProfile[]> {
    const rows = await this.kysely
      .selectFrom(CommunityMemberDao.TABLE)
      .innerJoin('user', 'user.id', 'community_member.userId')
      .leftJoin('trader_profile', 'trader_profile.userId', 'community_member.userId')
      .select([
        'community_member.id as id',
        'community_member.communityId as communityId',
        'community_member.userId as userId',
        'community_member.role as role',
        'community_member.joinedAt as joinedAt',
        'trader_profile.displayName as displayName',
        'user.name as userName',
      ])
      .where('community_member.communityId', '=', communityId)
      .orderBy('community_member.joinedAt', 'asc')
      .execute();

    return rows.map((row) => ({
      id: row.id,
      communityId: row.communityId,
      userId: row.userId,
      role: row.role,
      joinedAt: row.joinedAt,
      displayName: row.displayName ?? row.userName ?? 'Trader',
      userName: row.userName,
    }));
  }

  async findMemberUserIds(communityId: string): Promise<string[]> {
    const rows = await this.kysely
      .selectFrom(CommunityMemberDao.TABLE)
      .select('userId')
      .where('communityId', '=', communityId)
      .execute();
    return rows.map((r) => r.userId);
  }

  async canMentorViewMemberContent(
    viewerId: string,
    memberId: string,
  ): Promise<boolean> {
    if (viewerId === memberId) {
      return true;
    }

    const row = await this.kysely
      .selectFrom(`${CommunityMemberDao.TABLE} as viewer`)
      .innerJoin(
        `${CommunityMemberDao.TABLE} as member`,
        'member.communityId',
        'viewer.communityId',
      )
      .select('viewer.id')
      .where('viewer.userId', '=', viewerId)
      .where('member.userId', '=', memberId)
      .where('viewer.role', 'in', ['owner', 'mentor'])
      .executeTakeFirst();

    return row !== undefined;
  }

  async findSharedMentorCommunities(
    mentorUserId: string,
    memberUserId: string,
  ): Promise<Array<{ id: string; name: string }>> {
    const rows = await this.kysely
      .selectFrom(`${CommunityMemberDao.TABLE} as viewer`)
      .innerJoin(
        `${CommunityMemberDao.TABLE} as member`,
        'member.communityId',
        'viewer.communityId',
      )
      .innerJoin('community', 'community.id', 'viewer.communityId')
      .select(['community.id as id', 'community.name as name'])
      .where('viewer.userId', '=', mentorUserId)
      .where('member.userId', '=', memberUserId)
      .where('viewer.role', 'in', ['owner', 'mentor'])
      .orderBy('community.name', 'asc')
      .execute();

    return rows;
  }

  async create(
    data: Insertable<CommunityMember>,
  ): Promise<Selectable<CommunityMember> | null> {
    const row = await this.kysely
      .insertInto(CommunityMemberDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }
}
