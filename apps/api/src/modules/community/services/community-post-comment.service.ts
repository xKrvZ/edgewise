import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommunityMemberDao } from '../daos/community-member.dao';
import { CommunityPostCommentDao } from '../daos/community-post-comment.dao';
import { CommunityPostCommentReactionDao } from '../daos/community-post-comment-reaction.dao';
import { CommunityPostDao } from '../daos/community-post.dao';
import type { PostWithAuthorProfile } from '../daos/community-post.dao';
import type { CommunityPostCommentReactionType } from '../constants/community.constants';
import {
  type CommunityPostCommentDto,
  toCommunityPostCommentDto,
} from '../dtos/community-post-comment.dto';
import type { CreateCommunityPostCommentDto } from '../dtos/create-community-post-comment.dto';
import type {
  CommunityPostCommentReactionResultDto,
  SetCommunityPostCommentReactionDto,
} from '../dtos/set-community-post-comment-reaction.dto';
import { PrivacyUserDao } from '@/modules/privacy/daos/privacy-user.dao';
import { DELETED_USER_DISPLAY_NAME } from '@/modules/privacy/constants/privacy.constants';
import {
  collectAvatarSources,
  resolveAvatarUrlsForUsers,
} from '@/modules/privacy/utils/resolve-user-avatar.util';
import { StorageService } from '@/modules/storage/storage.service';

@Injectable()
export class CommunityPostCommentService {
  constructor(
    private readonly commentDao: CommunityPostCommentDao,
    private readonly reactionDao: CommunityPostCommentReactionDao,
    private readonly postDao: CommunityPostDao,
    private readonly memberDao: CommunityMemberDao,
    private readonly privacyUserDao: PrivacyUserDao,
    private readonly storage: StorageService,
  ) {}

  async listComments(
    communityId: string,
    postId: string,
    userId: string | null,
  ): Promise<CommunityPostCommentDto[]> {
    const post = await this.requireViewablePost(communityId, postId, userId);
    this.assertPostNotDeleted(post);
    this.assertCommentsEnabled(post);
    const rows = await this.commentDao.findByPost(post.id);
    return this.toCommentDtos(rows, userId);
  }

  async createComment(
    communityId: string,
    postId: string,
    userId: string,
    dto: CreateCommunityPostCommentDto,
  ): Promise<CommunityPostCommentDto> {
    const post = await this.requireViewablePost(communityId, postId, userId);
    this.assertPostNotDeleted(post);
    this.assertCommentsEnabled(post);
    await this.requireCanComment(post, userId);

    const body = dto.body.trim();
    if (!body) {
      throw new BadRequestException('Comment body cannot be empty');
    }

    if (dto.parentCommentId) {
      await this.requireValidParentComment(post.id, dto.parentCommentId);
    }

    const now = new Date();
    const row = await this.commentDao.create({
      postId: post.id,
      parentCommentId: dto.parentCommentId ?? null,
      authorUserId: userId,
      body,
      createdAt: now,
      updatedAt: now,
    });
    if (!row) {
      throw new NotFoundException('Failed to create comment');
    }

    const created = await this.commentDao.findById(row.id);
    if (!created) {
      throw new NotFoundException('Failed to load created comment');
    }

    const [comment] = await this.toCommentDtos([created], userId);
    return comment;
  }

  async setCommentReaction(
    communityId: string,
    postId: string,
    commentId: string,
    userId: string,
    dto: SetCommunityPostCommentReactionDto,
  ): Promise<CommunityPostCommentReactionResultDto> {
    const post = await this.requireViewablePost(communityId, postId, userId);
    this.assertPostNotDeleted(post);
    this.assertCommentsEnabled(post);
    await this.requireCanComment(post, userId);

    const comment = await this.commentDao.findById(commentId);
    if (!comment || comment.postId !== post.id) {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }

    const existing = await this.reactionDao.findByCommentAndUser(commentId, userId);

    if (dto.type === null) {
      if (existing) {
        await this.reactionDao.deleteByCommentAndUser(commentId, userId);
      }
    } else if (existing?.type === dto.type) {
      await this.reactionDao.deleteByCommentAndUser(commentId, userId);
    } else if (existing) {
      await this.reactionDao.updateType(commentId, userId, dto.type);
    } else {
      await this.reactionDao.create({
        commentId,
        userId,
        type: dto.type,
        createdAt: new Date(),
      });
    }

    const countsMap = await this.reactionDao.findCountsByCommentIds([commentId]);
    const counts = countsMap.get(commentId) ?? { likeCount: 0, dislikeCount: 0 };
    const userReactions = await this.reactionDao.findUserReactionsByCommentIds(userId, [
      commentId,
    ]);

    return {
      likeCount: counts.likeCount,
      dislikeCount: counts.dislikeCount,
      userReaction: userReactions.get(commentId) ?? null,
    };
  }

  async removeComment(
    communityId: string,
    postId: string,
    commentId: string,
    userId: string,
  ): Promise<void> {
    const post = await this.postDao.findByIdInCommunity(postId, communityId);
    if (!post) {
      throw new NotFoundException(`Post ${postId} not found`);
    }

    const comment = await this.commentDao.findById(commentId);
    if (!comment || comment.postId !== post.id) {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }

    const canDelete = await this.canDeleteComment(post, comment.authorUserId, userId);
    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    const deleted = await this.commentDao.deleteById(commentId);
    if (!deleted) {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }
  }

  private async requireValidParentComment(postId: string, parentCommentId: string): Promise<void> {
    const parent = await this.commentDao.findById(parentCommentId);
    if (!parent || parent.postId !== postId) {
      throw new BadRequestException('Parent comment not found on this post');
    }
  }

  private async requireViewablePost(
    communityId: string,
    postId: string,
    userId: string | null,
  ): Promise<PostWithAuthorProfile> {
    const post = await this.postDao.findByIdInCommunity(postId, communityId);
    if (!post) {
      throw new NotFoundException(`Post ${postId} not found`);
    }

    const canView = await this.canViewPost(post, userId);
    if (!canView) {
      throw new ForbiddenException('You do not have access to this post');
    }

    return post;
  }

  private assertPostNotDeleted(post: PostWithAuthorProfile): void {
    if (post.deletedAt) {
      throw new ForbiddenException('Comments are not available on deleted posts');
    }
  }

  private assertCommentsEnabled(post: PostWithAuthorProfile): void {
    if (!post.commentsEnabled) {
      throw new ForbiddenException('Comments are disabled for this post');
    }
  }

  async canViewPost(post: PostWithAuthorProfile, userId: string | null): Promise<boolean> {
    if (post.visibility === 'public') {
      return true;
    }
    if (!userId) {
      return false;
    }
    const membership = await this.memberDao.findMembership(post.communityId, userId);
    return membership !== null;
  }

  async canCommentOnPost(post: PostWithAuthorProfile, userId: string): Promise<boolean> {
    if (!post.commentsEnabled) {
      return false;
    }
    if (post.visibility === 'public') {
      return true;
    }
    const membership = await this.memberDao.findMembership(post.communityId, userId);
    return membership !== null;
  }

  private async requireCanComment(post: PostWithAuthorProfile, userId: string): Promise<void> {
    const canComment = await this.canCommentOnPost(post, userId);
    if (!canComment) {
      throw new ForbiddenException('You do not have permission to comment on this post');
    }
  }

  private async canDeleteComment(
    post: PostWithAuthorProfile,
    commentAuthorUserId: string,
    userId: string,
  ): Promise<boolean> {
    if (commentAuthorUserId === userId || post.authorUserId === userId) {
      return true;
    }
    const membership = await this.memberDao.findMembership(post.communityId, userId);
    return membership?.role === 'owner';
  }

  private async toCommentDtos(
    rows: Awaited<ReturnType<CommunityPostCommentDao['findByPost']>>,
    userId: string | null,
  ): Promise<CommunityPostCommentDto[]> {
    if (rows.length === 0) {
      return [];
    }

    const commentIds = rows.map((row) => row.id);
    const reactionCounts = await this.reactionDao.findCountsByCommentIds(commentIds);
    const userReactions = userId
      ? await this.reactionDao.findUserReactionsByCommentIds(userId, commentIds)
      : new Map<string, CommunityPostCommentReactionType>();

    const authorIds = [...new Set(rows.map((row) => row.authorUserId))];
    const deletedUserIds = await this.privacyUserDao.findDeletedUserIds(authorIds);
    const avatarUrls = await resolveAvatarUrlsForUsers(
      this.storage,
      collectAvatarSources(
        rows.map((row) => ({
          userId: row.authorUserId,
          userImage: row.userImage,
          avatarStorageKey: row.avatarStorageKey,
        })),
      ),
    );

    return rows.map((row) => {
      const isDeleted = deletedUserIds.has(row.authorUserId);
      const counts = reactionCounts.get(row.id) ?? { likeCount: 0, dislikeCount: 0 };
      return toCommunityPostCommentDto(
        row,
        isDeleted ? DELETED_USER_DISPLAY_NAME : row.authorDisplayName,
        isDeleted ? null : (avatarUrls.get(row.authorUserId) ?? null),
        counts,
        userReactions.get(row.id) ?? null,
      );
    });
  }
}
