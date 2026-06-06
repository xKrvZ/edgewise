import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable } from 'kysely';
import { resolveUserDisplayLabel } from '@/common/utils/resolve-user-display.util';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { CursorEncoder } from '@/database/utils/cursor-encoder';
import type { Notification } from '@/database/types/db';

export interface NotificationWithDetails extends Selectable<Notification> {
  actorName: string;
  communityName: string;
  userImage: string | null;
  avatarStorageKey: string | null;
}

interface NotificationCursorValue {
  read: boolean;
  createdAt: Date;
  id: string;
}

function encodeNotificationCursor(
  value: NotificationCursorValue,
  direction: 'forward' | 'backward',
): string {
  return CursorEncoder.encode({
    value: {
      primary: value.createdAt,
      tie: `${value.read ? '1' : '0'}:${value.id}`,
    },
    direction,
    filters: {},
    orderBy: { field: 'createdAt', direction: 'desc' },
  });
}

function decodeNotificationCursor(cursor: string): {
  value: NotificationCursorValue;
  direction: 'forward' | 'backward';
} | null {
  const decoded = CursorEncoder.decode(cursor);
  if (!decoded?.value) {
    return null;
  }

  if (
    typeof decoded.value === 'object' &&
    decoded.value !== null &&
    'primary' in decoded.value &&
    'tie' in decoded.value
  ) {
    const [readFlag, id] = String(decoded.value.tie).split(':');
    const createdAt =
      decoded.value.primary instanceof Date
        ? decoded.value.primary
        : new Date(String(decoded.value.primary));
    return {
      value: {
        read: readFlag === '1',
        createdAt,
        id,
      },
      direction: decoded.direction ?? 'forward',
    };
  }

  return null;
}

@Injectable()
export class NotificationDao extends KyselyDao<NotificationDao> {
  static readonly TABLE = 'notification' as const;

  private mapRow(row: {
    id: string;
    userId: string;
    type: string;
    actorId: string;
    commentId: string;
    targetType: string;
    targetId: string;
    communityId: string;
    read: boolean;
    createdAt: Date;
    profileDisplayName: string | null;
    userName: string | null;
    userEmail: string | null;
    userImage: string | null;
    avatarStorageKey: string | null;
    communityName: string;
  }): NotificationWithDetails {
    return {
      id: row.id,
      userId: row.userId,
      type: row.type,
      actorId: row.actorId,
      commentId: row.commentId,
      targetType: row.targetType,
      targetId: row.targetId,
      communityId: row.communityId,
      read: row.read,
      createdAt: row.createdAt,
      actorName: resolveUserDisplayLabel({
        displayName: row.profileDisplayName,
        name: row.userName,
        email: row.userEmail,
      }),
      communityName: row.communityName,
      userImage: row.userImage,
      avatarStorageKey: row.avatarStorageKey,
    };
  }

  private baseListQuery() {
    return this.kysely
      .selectFrom(NotificationDao.TABLE)
      .innerJoin('user', 'user.id', 'notification.actorId')
      .leftJoin('trader_profile', 'trader_profile.userId', 'notification.actorId')
      .innerJoin('community', 'community.id', 'notification.communityId')
      .selectAll('notification')
      .select([
        'trader_profile.displayName as profileDisplayName',
        'user.name as userName',
        'user.email as userEmail',
        'user.image as userImage',
        'trader_profile.avatarStorageKey as avatarStorageKey',
        'community.name as communityName',
      ]);
  }

  private applyNotificationCursor(
    query: ReturnType<NotificationDao['baseListQuery']>,
    cursor: NotificationCursorValue,
    direction: 'forward' | 'backward',
  ) {
    const forwardAfter = direction === 'forward';
    return query.where((eb) => {
      const readAfter = forwardAfter
        ? eb('notification.read', '>', cursor.read)
        : eb('notification.read', '<', cursor.read);
      const sameReadCreatedBefore = eb.and([
        eb('notification.read', '=', cursor.read),
        forwardAfter
          ? eb('notification.createdAt', '<', cursor.createdAt)
          : eb('notification.createdAt', '>', cursor.createdAt),
      ]);
      const sameReadCreatedSameIdBefore = eb.and([
        eb('notification.read', '=', cursor.read),
        eb('notification.createdAt', '=', cursor.createdAt),
        forwardAfter
          ? eb('notification.id', '<', cursor.id)
          : eb('notification.id', '>', cursor.id),
      ]);
      return eb.or([readAfter, sameReadCreatedBefore, sameReadCreatedSameIdBefore]);
    });
  }

  async findCursorPagedForUser(
    userId: string,
    options: { cursor?: string; limit?: number },
  ): Promise<PaginatedDto<NotificationWithDetails>> {
    const limit = options.limit ?? 25;
    let direction: 'forward' | 'backward' = 'forward';
    let cursorValue: NotificationCursorValue | undefined;

    if (options.cursor) {
      const decoded = decodeNotificationCursor(options.cursor);
      if (decoded) {
        cursorValue = decoded.value;
        direction = decoded.direction;
      }
    }

    let query = this.baseListQuery().where('notification.userId', '=', userId);

    if (cursorValue) {
      query = this.applyNotificationCursor(query, cursorValue, direction);
    }

    const orderDirection = direction === 'backward' ? 'asc' : 'desc';
    const readOrder = direction === 'backward' ? 'desc' : 'asc';

    const rows = await query
      .orderBy('notification.read', readOrder)
      .orderBy('notification.createdAt', orderDirection)
      .orderBy('notification.id', orderDirection)
      .limit(limit + 1)
      .execute();

    const hasMore = rows.length > limit;
    let resultRows = hasMore ? rows.slice(0, limit) : rows;
    if (direction === 'backward') {
      resultRows = resultRows.reverse();
    }

    const items = resultRows.map((row) => this.mapRow(row));

    const encodeCursor = (
      value: NotificationCursorValue | null,
      cursorDirection: 'forward' | 'backward',
    ): string | null => {
      if (!value) {
        return null;
      }
      return encodeNotificationCursor(value, cursorDirection);
    };

    const first = items[0];
    const last = items[items.length - 1];
    const firstCursor = first
      ? { read: first.read, createdAt: first.createdAt, id: first.id }
      : null;
    const lastCursor = last
      ? { read: last.read, createdAt: last.createdAt, id: last.id }
      : null;

    const previousCursor =
      options.cursor && firstCursor
        ? encodeCursor(firstCursor, 'backward')
        : null;
    const nextCursor =
      hasMore && lastCursor ? encodeCursor(lastCursor, 'forward') : null;

    return new PaginatedDto({
      items,
      previousCursor,
      nextCursor,
    });
  }

  async findWithDetailsByIdForUser(
    id: string,
    userId: string,
  ): Promise<NotificationWithDetails | null> {
    const row = await this.baseListQuery()
      .where('notification.id', '=', id)
      .where('notification.userId', '=', userId)
      .executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  async countUnread(userId: string): Promise<number> {
    const row = await this.kysely
      .selectFrom(NotificationDao.TABLE)
      .select((eb) => eb.fn.count<number>('id').as('count'))
      .where('userId', '=', userId)
      .where('read', '=', false)
      .executeTakeFirst();
    return Number(row?.count ?? 0);
  }

  async create(data: Insertable<Notification>): Promise<Selectable<Notification> | null> {
    const row = await this.kysely
      .insertInto(NotificationDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async createMany(data: Insertable<Notification>[]): Promise<void> {
    if (data.length === 0) {
      return;
    }
    await this.kysely.insertInto(NotificationDao.TABLE).values(data).execute();
  }

  async markRead(id: string, userId: string): Promise<Selectable<Notification> | null> {
    const row = await this.kysely
      .updateTable(NotificationDao.TABLE)
      .set({ read: true })
      .where('id', '=', id)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.kysely
      .updateTable(NotificationDao.TABLE)
      .set({ read: true })
      .where('userId', '=', userId)
      .where('read', '=', false)
      .executeTakeFirst();
    return Number(result.numUpdatedRows);
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<Selectable<Notification> | null> {
    const row = await this.kysely
      .selectFrom(NotificationDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }
}
