import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { Notification } from '@/database/types/db';

export interface NotificationWithDetails extends Selectable<Notification> {
  actorName: string;
  communityName: string;
}

@Injectable()
export class NotificationDao extends KyselyDao<NotificationDao> {
  static readonly TABLE = 'notification' as const;

  async findPagedForUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: NotificationWithDetails[]; total: number }> {
    const offset = (page - 1) * limit;

    const items = await this.kysely
      .selectFrom(NotificationDao.TABLE)
      .innerJoin('user', 'user.id', 'notification.actorId')
      .leftJoin('trader_profile', 'trader_profile.userId', 'notification.actorId')
      .innerJoin('community', 'community.id', 'notification.communityId')
      .selectAll('notification')
      .select([
        'trader_profile.displayName as profileDisplayName',
        'user.name as userName',
        'community.name as communityName',
      ])
      .where('notification.userId', '=', userId)
      .orderBy('notification.read', 'asc')
      .orderBy('notification.createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    const totalRow = await this.kysely
      .selectFrom(NotificationDao.TABLE)
      .select((eb) => eb.fn.count<number>('id').as('count'))
      .where('userId', '=', userId)
      .executeTakeFirst();

    return {
      items: items.map((row) => ({
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
        actorName: row.profileDisplayName ?? row.userName ?? 'Trader',
        communityName: row.communityName,
      })),
      total: Number(totalRow?.count ?? 0),
    };
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
