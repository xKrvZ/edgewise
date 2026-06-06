import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { PrivacyUserDao } from '@/modules/privacy/daos/privacy-user.dao';
import {
  collectAvatarSources,
  resolveAvatarUrlsForUsers,
  resolveUserAvatarUrl,
} from '@/modules/privacy/utils/resolve-user-avatar.util';
import { sanitizeAuthorPresentation } from '@/modules/privacy/utils/sanitize-user.util';
import { StorageService } from '@/modules/storage/storage.service';
import { NotificationDao } from '../daos/notification.dao';
import {
  type NotificationDto,
  type UnreadCountDto,
} from '../dtos/notification.dto';
import type { NotificationQueryDto } from '../dtos/notification-query.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationDao: NotificationDao,
    private readonly privacyUserDao: PrivacyUserDao,
    private readonly storage: StorageService,
  ) {}

  async list(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<PaginatedDto<NotificationDto>> {
    const limit = query.limit ?? 25;
    const page = await this.notificationDao.findCursorPagedForUser(userId, {
      cursor: query.cursor,
      limit,
    });

    const deletedUserIds = await this.privacyUserDao.findDeletedUserIds(
      page.items.map((row) => row.actorId),
    );
    const avatarUrls = await resolveAvatarUrlsForUsers(
      this.storage,
      collectAvatarSources(
        page.items.map((row) => ({
          userId: row.actorId,
          userImage: row.userImage,
          avatarStorageKey: row.avatarStorageKey,
        })),
      ),
    );

    return new PaginatedDto<NotificationDto>({
      items: page.items.map((row) => {
        const actor = sanitizeAuthorPresentation(
          row.actorId,
          row.actorName,
          deletedUserIds,
        );
        return {
          id: row.id,
          type: row.type as NotificationDto['type'],
          actorId: actor.authorId,
          actorName: actor.authorName,
          actorImage: deletedUserIds.has(row.actorId)
            ? null
            : (avatarUrls.get(row.actorId) ?? null),
          commentId: row.commentId,
          targetType: row.targetType as NotificationDto['targetType'],
          targetId: row.targetId,
          communityId: row.communityId,
          communityName: row.communityName,
          read: row.read,
          createdAt: row.createdAt,
        };
      }),
      previousCursor: page.previousCursor,
      nextCursor: page.nextCursor,
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

    const detail = await this.notificationDao.findWithDetailsByIdForUser(id, userId);
    const deletedUserIds = await this.privacyUserDao.findDeletedUserIds([row.actorId]);
    const actor = sanitizeAuthorPresentation(
      row.actorId,
      detail?.actorName ?? 'Trader',
      deletedUserIds,
    );
    const actorImage = deletedUserIds.has(row.actorId)
      ? null
      : await resolveUserAvatarUrl(this.storage, {
          userImage: detail?.userImage ?? null,
          avatarStorageKey: detail?.avatarStorageKey ?? null,
        });

    return {
      id: row.id,
      type: row.type as NotificationDto['type'],
      actorId: actor.authorId,
      actorName: actor.authorName,
      actorImage,
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
