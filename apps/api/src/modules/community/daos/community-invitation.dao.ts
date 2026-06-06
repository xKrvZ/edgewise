import { Injectable } from '@nestjs/common';
import { sql, type Insertable, type Selectable, type Updateable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { CommunityInvitation } from '@/database/types/db';

export interface InvitationWithCommunity {
  id: string;
  communityId: string;
  communityName: string;
  invitedBy: string;
  inviterName: string | null;
  inviteeEmail: string | null;
  inviteeUserId: string | null;
  role: string;
  status: string;
  token: string;
  createdAt: Date;
  respondedAt: Date | null;
}

@Injectable()
export class CommunityInvitationDao extends KyselyDao<CommunityInvitationDao> {
  static readonly TABLE = 'community_invitation' as const;

  async findById(id: string): Promise<Selectable<CommunityInvitation> | null> {
    const row = await this.kysely
      .selectFrom(CommunityInvitationDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ?? null;
  }

  async findPendingByCommunity(communityId: string): Promise<InvitationWithCommunity[]> {
    const rows = await this.kysely
      .selectFrom(CommunityInvitationDao.TABLE)
      .innerJoin('community', 'community.id', 'community_invitation.communityId')
      .leftJoin('user as inviter', 'inviter.id', 'community_invitation.invitedBy')
      .select([
        'community_invitation.id as id',
        'community_invitation.communityId as communityId',
        'community.name as communityName',
        'community_invitation.invitedBy as invitedBy',
        'inviter.name as inviterName',
        'community_invitation.inviteeEmail as inviteeEmail',
        'community_invitation.inviteeUserId as inviteeUserId',
        'community_invitation.role as role',
        'community_invitation.status as status',
        'community_invitation.token as token',
        'community_invitation.createdAt as createdAt',
        'community_invitation.respondedAt as respondedAt',
      ])
      .where('community_invitation.communityId', '=', communityId)
      .where('community_invitation.status', '=', 'pending')
      .orderBy('community_invitation.createdAt', 'desc')
      .execute();
    return rows;
  }

  async findPendingForUser(userId: string, email: string): Promise<InvitationWithCommunity[]> {
    const rows = await this.kysely
      .selectFrom(CommunityInvitationDao.TABLE)
      .innerJoin('community', 'community.id', 'community_invitation.communityId')
      .leftJoin('user as inviter', 'inviter.id', 'community_invitation.invitedBy')
      .select([
        'community_invitation.id as id',
        'community_invitation.communityId as communityId',
        'community.name as communityName',
        'community_invitation.invitedBy as invitedBy',
        'inviter.name as inviterName',
        'community_invitation.inviteeEmail as inviteeEmail',
        'community_invitation.inviteeUserId as inviteeUserId',
        'community_invitation.role as role',
        'community_invitation.status as status',
        'community_invitation.token as token',
        'community_invitation.createdAt as createdAt',
        'community_invitation.respondedAt as respondedAt',
      ])
      .where('community_invitation.status', '=', 'pending')
      .where((eb) =>
        eb.or([
          eb('community_invitation.inviteeUserId', '=', userId),
          eb('community_invitation.inviteeEmail', '=', email),
        ]),
      )
      .orderBy('community_invitation.createdAt', 'desc')
      .execute();
    return rows;
  }

  async findPendingDuplicate(
    communityId: string,
    inviteeUserId: string,
  ): Promise<Selectable<CommunityInvitation> | null> {
    const row = await this.kysely
      .selectFrom(CommunityInvitationDao.TABLE)
      .selectAll()
      .where('communityId', '=', communityId)
      .where('inviteeUserId', '=', inviteeUserId)
      .where('status', '=', 'pending')
      .executeTakeFirst();
    return row ?? null;
  }

  async create(
    data: Insertable<CommunityInvitation>,
  ): Promise<Selectable<CommunityInvitation> | null> {
    const row = await this.kysely
      .insertInto(CommunityInvitationDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async updateStatus(
    id: string,
    status: string,
  ): Promise<Selectable<CommunityInvitation> | null> {
    const row = await this.kysely
      .updateTable(CommunityInvitationDao.TABLE)
      .set({ status, respondedAt: sql`now()` })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async update(
    id: string,
    data: Updateable<CommunityInvitation>,
  ): Promise<Selectable<CommunityInvitation> | null> {
    const row = await this.kysely
      .updateTable(CommunityInvitationDao.TABLE)
      .set(data)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async findUserByEmail(email: string): Promise<{ id: string; email: string; name: string } | null> {
    const row = await this.kysely
      .selectFrom('user')
      .select(['id', 'email', 'name'])
      .where(sql`lower("email")`, '=', email.toLowerCase())
      .executeTakeFirst();
    return row ?? null;
  }

  async findUserEmail(userId: string): Promise<string | null> {
    const row = await this.kysely
      .selectFrom('user')
      .select('email')
      .where('id', '=', userId)
      .executeTakeFirst();
    return row?.email ?? null;
  }
}
