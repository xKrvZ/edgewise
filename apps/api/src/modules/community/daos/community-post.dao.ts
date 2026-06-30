import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable, Updateable } from 'kysely';
import { resolveUserDisplayLabel } from '@/common/utils/resolve-user-display.util';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { CommunityPost } from '@/database/types/db';
import type { CommunityPostVisibility } from '../constants/community.constants';

export interface FindCommunityPostsOptions {
  visibility?: CommunityPostVisibility;
  excludePostId?: string;
  limit?: number;
  includeDeleted?: boolean;
  includeDiscoverHidden?: boolean;
}

export interface PostWithAuthorProfile extends Selectable<CommunityPost> {
  authorDisplayName: string;
  userImage: string | null;
  avatarStorageKey: string | null;
}
@Injectable()
export class CommunityPostDao extends KyselyDao<CommunityPostDao> {
  static readonly TABLE = 'community_post' as const;

  async findByCommunity(
    communityId: string,
    options?: FindCommunityPostsOptions,
  ): Promise<PostWithAuthorProfile[]> {
    let query = this.kysely
      .selectFrom(CommunityPostDao.TABLE)
      .innerJoin('user', 'user.id', 'community_post.authorUserId')
      .leftJoin('trader_profile', 'trader_profile.userId', 'community_post.authorUserId')
      .select([
        'community_post.id as id',
        'community_post.communityId as communityId',
        'community_post.authorUserId as authorUserId',
        'community_post.title as title',
        'community_post.content as content',
        'community_post.headerStorageKey as headerStorageKey',
        'community_post.visibility as visibility',
        'community_post.commentsEnabled as commentsEnabled',
        'community_post.publishedAt as publishedAt',
        'community_post.createdAt as createdAt',
        'community_post.updatedAt as updatedAt',
        'community_post.deletedAt as deletedAt',
        'community_post.discoverHiddenAt as discoverHiddenAt',
        'trader_profile.displayName as displayName',
        'user.name as userName',
        'user.email as userEmail',
        'user.image as userImage',
        'trader_profile.avatarStorageKey as avatarStorageKey',
      ])
      .where('community_post.communityId', '=', communityId);

    if (options?.visibility) {
      query = query.where('community_post.visibility', '=', options.visibility);
    }
    if (options?.excludePostId) {
      query = query.where('community_post.id', '!=', options.excludePostId);
    }
    if (!options?.includeDeleted) {
      query = query.where('community_post.deletedAt', 'is', null);
    }
    if (!options?.includeDiscoverHidden) {
      query = query.where('community_post.discoverHiddenAt', 'is', null);
    }

    query = query.orderBy('community_post.publishedAt', 'desc');

    if (options?.limit != null) {
      query = query.limit(options.limit);
    }

    const rows = await query.execute();

    return rows.map((row) => ({
      id: row.id,
      communityId: row.communityId,
      authorUserId: row.authorUserId,
      title: row.title,
      content: row.content,
      headerStorageKey: row.headerStorageKey,
      visibility: row.visibility,
      commentsEnabled: row.commentsEnabled,
      publishedAt: row.publishedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      discoverHiddenAt: row.discoverHiddenAt,
      authorDisplayName: resolveUserDisplayLabel({
        displayName: row.displayName,
        name: row.userName,
        email: row.userEmail,
      }),
      userImage: row.userImage,
      avatarStorageKey: row.avatarStorageKey,
    }));
  }

  async findByIdInCommunity(
    id: string,
    communityId: string,
  ): Promise<PostWithAuthorProfile | null> {
    const row = await this.kysely
      .selectFrom(CommunityPostDao.TABLE)
      .innerJoin('user', 'user.id', 'community_post.authorUserId')
      .leftJoin('trader_profile', 'trader_profile.userId', 'community_post.authorUserId')
      .select([
        'community_post.id as id',
        'community_post.communityId as communityId',
        'community_post.authorUserId as authorUserId',
        'community_post.title as title',
        'community_post.content as content',
        'community_post.headerStorageKey as headerStorageKey',
        'community_post.visibility as visibility',
        'community_post.commentsEnabled as commentsEnabled',
        'community_post.publishedAt as publishedAt',
        'community_post.createdAt as createdAt',
        'community_post.updatedAt as updatedAt',
        'community_post.deletedAt as deletedAt',
        'community_post.discoverHiddenAt as discoverHiddenAt',
        'trader_profile.displayName as displayName',
        'user.name as userName',
        'user.email as userEmail',
        'user.image as userImage',
        'trader_profile.avatarStorageKey as avatarStorageKey',
      ])
      .where('community_post.id', '=', id)
      .where('community_post.communityId', '=', communityId)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      communityId: row.communityId,
      authorUserId: row.authorUserId,
      title: row.title,
      content: row.content,
      headerStorageKey: row.headerStorageKey,
      visibility: row.visibility,
      commentsEnabled: row.commentsEnabled,
      publishedAt: row.publishedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      discoverHiddenAt: row.discoverHiddenAt,
      authorDisplayName: resolveUserDisplayLabel({
        displayName: row.displayName,
        name: row.userName,
        email: row.userEmail,
      }),
      userImage: row.userImage,
      avatarStorageKey: row.avatarStorageKey,
    };
  }

  async create(data: Insertable<CommunityPost>): Promise<Selectable<CommunityPost> | null> {
    const row = await this.kysely
      .insertInto(CommunityPostDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async updateInCommunity(
    id: string,
    communityId: string,
    data: Updateable<CommunityPost>,
  ): Promise<Selectable<CommunityPost> | null> {
    const row = await this.kysely
      .updateTable(CommunityPostDao.TABLE)
      .set({ ...data, updatedAt: new Date() })
      .where('id', '=', id)
      .where('communityId', '=', communityId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async softDeleteInCommunity(id: string, communityId: string): Promise<boolean> {
    const result = await this.kysely
      .updateTable(CommunityPostDao.TABLE)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where('id', '=', id)
      .where('communityId', '=', communityId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0) > 0;
  }

  async restoreInCommunity(id: string, communityId: string): Promise<boolean> {
    const result = await this.kysely
      .updateTable(CommunityPostDao.TABLE)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where('id', '=', id)
      .where('communityId', '=', communityId)
      .where('deletedAt', 'is not', null)
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0) > 0;
  }

  async setDiscoverHiddenInCommunity(
    id: string,
    communityId: string,
    hiddenAt: Date | null,
  ): Promise<boolean> {
    const result = await this.kysely
      .updateTable(CommunityPostDao.TABLE)
      .set({ discoverHiddenAt: hiddenAt, updatedAt: new Date() })
      .where('id', '=', id)
      .where('communityId', '=', communityId)
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0) > 0;
  }
}
