import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable } from 'kysely';
import { resolveUserDisplayLabel } from '@/common/utils/resolve-user-display.util';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { CommunityBan } from '@/database/types/db';

export interface BanWithProfile {
  id: string;
  communityId: string;
  userId: string;
  bannedBy: string;
  bannedAt: Date;
  reason: string | null;
  displayName: string;
  userName: string | null;
  userImage: string | null;
  avatarStorageKey: string | null;
  bannedByDisplayName: string;
}

@Injectable()
export class CommunityBanDao extends KyselyDao<CommunityBanDao> {
  static readonly TABLE = 'community_ban' as const;

  async findBan(
    communityId: string,
    userId: string,
  ): Promise<Selectable<CommunityBan> | null> {
    const row = await this.kysely
      .selectFrom(CommunityBanDao.TABLE)
      .selectAll()
      .where('communityId', '=', communityId)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  async findBansWithProfiles(communityId: string): Promise<BanWithProfile[]> {
    const rows = await this.kysely
      .selectFrom(`${CommunityBanDao.TABLE} as ban`)
      .innerJoin('user as bannedUser', 'bannedUser.id', 'ban.userId')
      .leftJoin('trader_profile as bannedProfile', 'bannedProfile.userId', 'ban.userId')
      .innerJoin('user as banner', 'banner.id', 'ban.bannedBy')
      .leftJoin('trader_profile as bannerProfile', 'bannerProfile.userId', 'ban.bannedBy')
      .select([
        'ban.id as id',
        'ban.communityId as communityId',
        'ban.userId as userId',
        'ban.bannedBy as bannedBy',
        'ban.bannedAt as bannedAt',
        'ban.reason as reason',
        'bannedProfile.displayName as displayName',
        'bannedUser.name as userName',
        'bannedUser.email as userEmail',
        'bannedUser.image as userImage',
        'bannedProfile.avatarStorageKey as avatarStorageKey',
        'bannerProfile.displayName as bannerDisplayName',
        'banner.name as bannerUserName',
        'banner.email as bannerUserEmail',
      ])
      .where('ban.communityId', '=', communityId)
      .orderBy('ban.bannedAt', 'desc')
      .execute();

    return rows.map((row) => ({
      id: row.id,
      communityId: row.communityId,
      userId: row.userId,
      bannedBy: row.bannedBy,
      bannedAt: row.bannedAt,
      reason: row.reason,
      displayName: resolveUserDisplayLabel({
        displayName: row.displayName,
        name: row.userName,
        email: row.userEmail,
      }),
      userName: row.userName,
      userImage: row.userImage,
      avatarStorageKey: row.avatarStorageKey,
      bannedByDisplayName: resolveUserDisplayLabel({
        displayName: row.bannerDisplayName,
        name: row.bannerUserName,
        email: row.bannerUserEmail,
      }),
    }));
  }

  async create(
    data: Insertable<CommunityBan>,
  ): Promise<Selectable<CommunityBan> | null> {
    const row = await this.kysely
      .insertInto(CommunityBanDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async deleteByCommunityAndUser(
    communityId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(CommunityBanDao.TABLE)
      .where('communityId', '=', communityId)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }
}
