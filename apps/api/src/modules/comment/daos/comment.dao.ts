import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable, Updateable } from 'kysely';
import { resolveUserDisplayLabel } from '@/common/utils/resolve-user-display.util';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { Comment } from '@/database/types/db';
import type { CommentTargetType } from '../constants/comment.constants';

export interface CommentWithAuthor extends Selectable<Comment> {
  authorName: string;
  userImage: string | null;
  avatarStorageKey: string | null;
}

@Injectable()
export class CommentDao extends KyselyDao<CommentDao> {
  static readonly TABLE = 'comment' as const;

  async findByTarget(
    targetType: CommentTargetType,
    targetId: string,
  ): Promise<CommentWithAuthor[]> {
    const rows = await this.kysely
      .selectFrom(CommentDao.TABLE)
      .innerJoin('user', 'user.id', 'comment.authorId')
      .leftJoin('trader_profile', 'trader_profile.userId', 'comment.authorId')
      .selectAll('comment')
      .select([
        'trader_profile.displayName as profileDisplayName',
        'user.name as userName',
        'user.email as userEmail',
        'user.image as userImage',
        'trader_profile.avatarStorageKey as avatarStorageKey',
      ])
      .where('comment.targetType', '=', targetType)
      .where('comment.targetId', '=', targetId)
      .orderBy('comment.createdAt', 'asc')
      .execute();

    return rows.map((row) => ({
      id: row.id,
      authorId: row.authorId,
      targetType: row.targetType,
      targetId: row.targetId,
      communityId: row.communityId,
      parentId: row.parentId,
      body: row.body,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      authorName: resolveUserDisplayLabel({
        displayName: row.profileDisplayName,
        name: row.userName,
        email: row.userEmail,
      }),
      userImage: row.userImage,
      avatarStorageKey: row.avatarStorageKey,
    }));
  }

  async findById(id: string): Promise<Selectable<Comment> | null> {
    const row = await this.kysely
      .selectFrom(CommentDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ?? null;
  }

  async create(data: Insertable<Comment>): Promise<CommentWithAuthor | null> {
    const row = await this.kysely
      .insertInto(CommentDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    if (!row) {
      return null;
    }

    const author = await this.kysely
      .selectFrom('user')
      .leftJoin('trader_profile', 'trader_profile.userId', 'user.id')
      .select([
        'trader_profile.displayName as profileDisplayName',
        'user.name as userName',
        'user.email as userEmail',
        'user.image as userImage',
        'trader_profile.avatarStorageKey as avatarStorageKey',
      ])
      .where('user.id', '=', row.authorId)
      .executeTakeFirst();

    return {
      ...row,
      authorName: resolveUserDisplayLabel({
        displayName: author?.profileDisplayName,
        name: author?.userName,
        email: author?.userEmail,
      }),
      userImage: author?.userImage ?? null,
      avatarStorageKey: author?.avatarStorageKey ?? null,
    };
  }

  async update(
    id: string,
    authorId: string,
    data: Updateable<Comment>,
  ): Promise<CommentWithAuthor | null> {
    const row = await this.kysely
      .updateTable(CommentDao.TABLE)
      .set({ ...data, updatedAt: new Date() })
      .where('id', '=', id)
      .where('authorId', '=', authorId)
      .returningAll()
      .executeTakeFirst();
    if (!row) {
      return null;
    }

    const author = await this.kysely
      .selectFrom('user')
      .leftJoin('trader_profile', 'trader_profile.userId', 'user.id')
      .select([
        'trader_profile.displayName as profileDisplayName',
        'user.name as userName',
        'user.email as userEmail',
        'user.image as userImage',
        'trader_profile.avatarStorageKey as avatarStorageKey',
      ])
      .where('user.id', '=', row.authorId)
      .executeTakeFirst();

    return {
      ...row,
      authorName: resolveUserDisplayLabel({
        displayName: author?.profileDisplayName,
        name: author?.userName,
        email: author?.userEmail,
      }),
      userImage: author?.userImage ?? null,
      avatarStorageKey: author?.avatarStorageKey ?? null,
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(CommentDao.TABLE)
      .where('id', '=', id)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }

  async deleteByAuthor(id: string, authorId: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(CommentDao.TABLE)
      .where('id', '=', id)
      .where('authorId', '=', authorId)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }
}
