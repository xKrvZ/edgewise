import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { CommunityPostCommentReaction } from '@/database/types/db';
import type { CommunityPostCommentReactionType } from '../constants/community.constants';

export interface CommentReactionCounts {
  likeCount: number;
  dislikeCount: number;
}

@Injectable()
export class CommunityPostCommentReactionDao extends KyselyDao<CommunityPostCommentReactionDao> {
  static readonly TABLE = 'community_post_comment_reaction' as const;

  async findCountsByCommentIds(
    commentIds: string[],
  ): Promise<Map<string, CommentReactionCounts>> {
    if (commentIds.length === 0) {
      return new Map();
    }

    const rows = await this.kysely
      .selectFrom(CommunityPostCommentReactionDao.TABLE)
      .select(['commentId', 'type'])
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('commentId', 'in', commentIds)
      .groupBy(['commentId', 'type'])
      .execute();

    const counts = new Map<string, CommentReactionCounts>();
    for (const commentId of commentIds) {
      counts.set(commentId, { likeCount: 0, dislikeCount: 0 });
    }

    for (const row of rows) {
      const entry = counts.get(row.commentId)!;
      if (row.type === 'like') {
        entry.likeCount = Number(row.count);
      } else if (row.type === 'dislike') {
        entry.dislikeCount = Number(row.count);
      }
    }

    return counts;
  }

  async findUserReactionsByCommentIds(
    userId: string,
    commentIds: string[],
  ): Promise<Map<string, CommunityPostCommentReactionType>> {
    if (commentIds.length === 0) {
      return new Map();
    }

    const rows = await this.kysely
      .selectFrom(CommunityPostCommentReactionDao.TABLE)
      .select(['commentId', 'type'])
      .where('userId', '=', userId)
      .where('commentId', 'in', commentIds)
      .execute();

    const reactions = new Map<string, CommunityPostCommentReactionType>();
    for (const row of rows) {
      if (row.type === 'like' || row.type === 'dislike') {
        reactions.set(row.commentId, row.type);
      }
    }
    return reactions;
  }

  async findByCommentAndUser(
    commentId: string,
    userId: string,
  ): Promise<Selectable<CommunityPostCommentReaction> | null> {
    const row = await this.kysely
      .selectFrom(CommunityPostCommentReactionDao.TABLE)
      .selectAll()
      .where('commentId', '=', commentId)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  async create(
    data: Insertable<CommunityPostCommentReaction>,
  ): Promise<Selectable<CommunityPostCommentReaction> | null> {
    const row = await this.kysely
      .insertInto(CommunityPostCommentReactionDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async updateType(
    commentId: string,
    userId: string,
    type: CommunityPostCommentReactionType,
  ): Promise<Selectable<CommunityPostCommentReaction> | null> {
    const row = await this.kysely
      .updateTable(CommunityPostCommentReactionDao.TABLE)
      .set({ type })
      .where('commentId', '=', commentId)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async deleteByCommentAndUser(commentId: string, userId: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(CommunityPostCommentReactionDao.TABLE)
      .where('commentId', '=', commentId)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
