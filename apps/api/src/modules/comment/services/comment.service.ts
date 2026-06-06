import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Insertable } from 'kysely';
import type { Notification } from '@/database/types/db';
import { NotificationDao } from '@/modules/notification/daos/notification.dao';
import type { NotificationType } from '@/modules/notification/constants/notification.constants';
import { CommentDao } from '../daos/comment.dao';
import type { CommentTargetType } from '../constants/comment.constants';
import {
  type CommentAccessDto,
  type CommentDto,
} from '../dtos/comment.dto';
import type { CreateCommentDto } from '../dtos/create-comment.dto';
import type { UpdateCommentDto } from '../dtos/update-comment.dto';
import { CommentPermissionService } from './comment-permission.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentDao: CommentDao,
    private readonly permissionService: CommentPermissionService,
    private readonly notificationDao: NotificationDao,
  ) {}

  async getAccess(
    userId: string,
    targetType: CommentTargetType,
    targetId: string,
  ): Promise<CommentAccessDto> {
    const ownerId = await this.permissionService.getTargetOwnerId(targetType, targetId);
    if (!ownerId) {
      return {
        canView: false,
        canComment: false,
        isContentOwner: false,
        communities: [],
      };
    }

    const canView = await this.permissionService.canViewComments(
      userId,
      targetType,
      targetId,
    );
    const communities = await this.permissionService.getCommentCommunities(
      userId,
      targetType,
      targetId,
    );

    return {
      canView,
      canComment: communities.length > 0,
      isContentOwner: ownerId === userId,
      communities,
    };
  }

  async list(
    userId: string,
    targetType: CommentTargetType,
    targetId: string,
  ): Promise<CommentDto[]> {
    const canView = await this.permissionService.canViewComments(
      userId,
      targetType,
      targetId,
    );
    if (!canView) {
      throw new ForbiddenException('You do not have access to view these comments');
    }

    const rows = await this.commentDao.findByTarget(targetType, targetId);
    return this.buildThread(rows);
  }

  async create(userId: string, dto: CreateCommentDto): Promise<CommentDto> {
    const body = dto.body.trim();
    if (!body) {
      throw new BadRequestException('Comment body cannot be empty');
    }

    const ownerId = await this.permissionService.getTargetOwnerId(
      dto.targetType,
      dto.targetId,
    );
    if (!ownerId) {
      throw new NotFoundException('Target not found');
    }

    let parentAuthorId: string | null = null;

    if (dto.parentId) {
      const parent = await this.commentDao.findById(dto.parentId);
      if (
        !parent ||
        parent.targetType !== dto.targetType ||
        parent.targetId !== dto.targetId
      ) {
        throw new NotFoundException('Parent comment not found');
      }

      parentAuthorId = parent.authorId;

      const canReply = await this.permissionService.canReplyToComment(
        userId,
        dto.targetType,
        dto.targetId,
        parent.authorId,
        parent.communityId,
      );
      if (!canReply) {
        throw new ForbiddenException('You cannot reply to this comment');
      }

      if (dto.communityId !== parent.communityId) {
        throw new BadRequestException('Community must match the parent comment');
      }
    } else {
      const canComment = await this.permissionService.canCommentOnTarget(
        userId,
        dto.targetType,
        dto.targetId,
        dto.communityId,
      );
      if (!canComment) {
        throw new ForbiddenException('You cannot comment on this content');
      }
    }

    const row = await this.commentDao.create({
      authorId: userId,
      targetType: dto.targetType,
      targetId: dto.targetId,
      communityId: dto.communityId,
      parentId: dto.parentId ?? null,
      body,
    });
    if (!row) {
      throw new NotFoundException('Failed to create comment');
    }

    await this.createNotifications({
      actorId: userId,
      commentId: row.id,
      targetType: dto.targetType,
      targetId: dto.targetId,
      communityId: dto.communityId,
      contentOwnerId: ownerId,
      parentAuthorId,
      isReply: !!dto.parentId,
    });

    return this.toDto(row);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentDto> {
    const body = dto.body.trim();
    if (!body) {
      throw new BadRequestException('Comment body cannot be empty');
    }

    const row = await this.commentDao.update(id, userId, { body });
    if (!row) {
      throw new NotFoundException(`Comment ${id} not found`);
    }
    return this.toDto(row);
  }

  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.commentDao.findById(id);
    if (!comment) {
      throw new NotFoundException(`Comment ${id} not found`);
    }

    if (comment.authorId === userId) {
      const deleted = await this.commentDao.deleteByAuthor(id, userId);
      if (!deleted) {
        throw new NotFoundException(`Comment ${id} not found`);
      }
      return;
    }

    const canModerate = await this.permissionService.canModerateComment(
      userId,
      comment.communityId,
    );
    if (!canModerate) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    const deleted = await this.commentDao.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Comment ${id} not found`);
    }
  }

  private async createNotifications(params: {
    actorId: string;
    commentId: string;
    targetType: CommentTargetType;
    targetId: string;
    communityId: string;
    contentOwnerId: string;
    parentAuthorId: string | null;
    isReply: boolean;
  }): Promise<void> {
    const type: NotificationType = params.isReply ? 'reply' : 'comment';
    const recipients = new Set<string>();

    if (params.contentOwnerId !== params.actorId) {
      recipients.add(params.contentOwnerId);
    }
    if (
      params.isReply &&
      params.parentAuthorId &&
      params.parentAuthorId !== params.actorId
    ) {
      recipients.add(params.parentAuthorId);
    }

    const notifications: Insertable<Notification>[] = [...recipients].map(
      (userId) => ({
        userId,
        type,
        actorId: params.actorId,
        commentId: params.commentId,
        targetType: params.targetType,
        targetId: params.targetId,
        communityId: params.communityId,
        read: false,
      }),
    );

    await this.notificationDao.createMany(notifications);
  }

  private buildThread(
    rows: Array<{
      id: string;
      authorId: string;
      authorName: string;
      targetType: string;
      targetId: string;
      communityId: string;
      parentId: string | null;
      body: string;
      createdAt: Date;
      updatedAt: Date;
    }>,
  ): CommentDto[] {
    const byId = new Map<string, CommentDto>();
    const roots: CommentDto[] = [];

    for (const row of rows) {
      byId.set(row.id, {
        id: row.id,
        authorId: row.authorId,
        authorName: row.authorName,
        targetType: row.targetType as CommentTargetType,
        targetId: row.targetId,
        communityId: row.communityId,
        parentId: row.parentId,
        body: row.body,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        replies: [],
      });
    }

    for (const row of rows) {
      const dto = byId.get(row.id)!;
      if (row.parentId) {
        const parent = byId.get(row.parentId);
        if (parent) {
          parent.replies = parent.replies ?? [];
          parent.replies.push(dto);
        }
      } else {
        roots.push(dto);
      }
    }

    return roots;
  }

  private toDto(row: {
    id: string;
    authorId: string;
    authorName: string;
    targetType: string;
    targetId: string;
    communityId: string;
    parentId: string | null;
    body: string;
    createdAt: Date;
    updatedAt: Date;
  }): CommentDto {
    return {
      id: row.id,
      authorId: row.authorId,
      authorName: row.authorName,
      targetType: row.targetType as CommentTargetType,
      targetId: row.targetId,
      communityId: row.communityId,
      parentId: row.parentId,
      body: row.body,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
