import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable } from 'kysely';
import { resolveUserDisplayLabel } from '@/common/utils/resolve-user-display.util';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { CommunityPostComment } from '@/database/types/db';

export interface PostCommentWithAuthorProfile extends Selectable<CommunityPostComment> {
  authorDisplayName: string;
  userImage: string | null;
  avatarStorageKey: string | null;
}

@Injectable()
export class CommunityPostCommentDao extends KyselyDao<CommunityPostCommentDao> {
  static readonly TABLE = 'community_post_comment' as const;

  async findByPost(postId: string): Promise<PostCommentWithAuthorProfile[]> {
    const rows = await this.kysely
      .selectFrom(CommunityPostCommentDao.TABLE)
      .innerJoin('user', 'user.id', 'community_post_comment.authorUserId')
      .leftJoin('trader_profile', 'trader_profile.userId', 'community_post_comment.authorUserId')
      .select([
        'community_post_comment.id as id',
        'community_post_comment.postId as postId',
        'community_post_comment.parentCommentId as parentCommentId',
        'community_post_comment.authorUserId as authorUserId',
        'community_post_comment.body as body',
        'community_post_comment.createdAt as createdAt',
        'community_post_comment.updatedAt as updatedAt',
        'trader_profile.displayName as displayName',
        'user.name as userName',
        'user.email as userEmail',
        'user.image as userImage',
        'trader_profile.avatarStorageKey as avatarStorageKey',
      ])
      .where('community_post_comment.postId', '=', postId)
      .orderBy('community_post_comment.createdAt', 'asc')
      .execute();

    return rows.map((row) => ({
      id: row.id,
      postId: row.postId,
      parentCommentId: row.parentCommentId,
      authorUserId: row.authorUserId,
      body: row.body,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      authorDisplayName: resolveUserDisplayLabel({
        displayName: row.displayName,
        name: row.userName,
        email: row.userEmail,
      }),
      userImage: row.userImage,
      avatarStorageKey: row.avatarStorageKey,
    }));
  }

  async findById(id: string): Promise<PostCommentWithAuthorProfile | null> {
    const row = await this.kysely
      .selectFrom(CommunityPostCommentDao.TABLE)
      .innerJoin('user', 'user.id', 'community_post_comment.authorUserId')
      .leftJoin('trader_profile', 'trader_profile.userId', 'community_post_comment.authorUserId')
      .select([
        'community_post_comment.id as id',
        'community_post_comment.postId as postId',
        'community_post_comment.parentCommentId as parentCommentId',
        'community_post_comment.authorUserId as authorUserId',
        'community_post_comment.body as body',
        'community_post_comment.createdAt as createdAt',
        'community_post_comment.updatedAt as updatedAt',
        'trader_profile.displayName as displayName',
        'user.name as userName',
        'user.email as userEmail',
        'user.image as userImage',
        'trader_profile.avatarStorageKey as avatarStorageKey',
      ])
      .where('community_post_comment.id', '=', id)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      postId: row.postId,
      parentCommentId: row.parentCommentId,
      authorUserId: row.authorUserId,
      body: row.body,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      authorDisplayName: resolveUserDisplayLabel({
        displayName: row.displayName,
        name: row.userName,
        email: row.userEmail,
      }),
      userImage: row.userImage,
      avatarStorageKey: row.avatarStorageKey,
    };
  }

  async create(
    data: Insertable<CommunityPostComment>,
  ): Promise<Selectable<CommunityPostComment> | null> {
    const row = await this.kysely
      .insertInto(CommunityPostCommentDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(CommunityPostCommentDao.TABLE)
      .where('id', '=', id)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
