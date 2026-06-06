import { Injectable, NotFoundException } from '@nestjs/common';
import { PageDto } from '@/database/dtos/page.dto';
import { NotificationDao } from '../daos/notification.dao';
import {
  type NotificationDto,
  type UnreadCountDto,
} from '../dtos/notification.dto';
import type { NotificationQueryDto } from '../dtos/notification-query.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly notificationDao: NotificationDao) {}

  async list(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<PageDto<NotificationDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const { items, total } = await this.notificationDao.findPagedForUser(
      userId,
      page,
      limit,
    );

    return new PageDto<NotificationDto>({
      items: items.map((row) => ({
        id: row.id,
        type: row.type as NotificationDto['type'],
        actorId: row.actorId,
        actorName: row.actorName,
        commentId: row.commentId,
        targetType: row.targetType as NotificationDto['targetType'],
        targetId: row.targetId,
        communityId: row.communityId,
        communityName: row.communityName,
        read: row.read,
        createdAt: row.createdAt,
      })),
      total,
      page,
      limit,
    });
  }

  async getUnreadCount(userId: string): Promise<UnreadCountDto> {
    const count = await this.notificationDao.countUnread(userId);
    return { count };
  }

  async markRead(id: string, userId: string): Promise<NotificationDto> {
    const existing = await this.notificationDao.findByIdForUser(id, userId);
    if (!existing) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    const row = await this.notificationDao.markRead(id, userId);
    if (!row) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    const paged = await this.notificationDao.findPagedForUser(userId, 1, 1);
    const detail = paged.items.find((item) => item.id === id);
    return {
      id: row.id,
      type: row.type as NotificationDto['type'],
      actorId: row.actorId,
      actorName: detail?.actorName ?? 'Trader',
      commentId: row.commentId,
      targetType: row.targetType as NotificationDto['targetType'],
      targetId: row.targetId,
      communityId: row.communityId,
      communityName: detail?.communityName ?? '',
      read: row.read,
      createdAt: row.createdAt,
    };
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationDao.markAllRead(userId);
  }
}
