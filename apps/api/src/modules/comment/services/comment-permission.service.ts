import { Injectable } from '@nestjs/common';
import { CommunityMemberDao } from '@/modules/community/daos/community-member.dao';
import { PlaybookDao } from '@/modules/playbook/daos/playbook.dao';
import { TradeDao } from '@/modules/trade/daos/trade.dao';
import type { CommentTargetType } from '../constants/comment.constants';

@Injectable()
export class CommentPermissionService {
  constructor(
    private readonly memberDao: CommunityMemberDao,
    private readonly tradeDao: TradeDao,
    private readonly playbookDao: PlaybookDao,
  ) {}

  async getTargetOwnerId(
    targetType: CommentTargetType,
    targetId: string,
  ): Promise<string | null> {
    if (targetType === 'trade') {
      const trade = await this.tradeDao.findById(targetId);
      return trade?.userId ?? null;
    }
    const playbook = await this.playbookDao.findById(targetId);
    return playbook?.userId ?? null;
  }

  async canViewComments(
    userId: string,
    targetType: CommentTargetType,
    targetId: string,
  ): Promise<boolean> {
    const ownerId = await this.getTargetOwnerId(targetType, targetId);
    if (!ownerId) {
      return false;
    }
    if (ownerId === userId) {
      return true;
    }
    return this.memberDao.canMentorViewMemberContent(userId, ownerId);
  }

  async canCommentOnTarget(
    userId: string,
    targetType: CommentTargetType,
    targetId: string,
    communityId: string,
  ): Promise<boolean> {
    const ownerId = await this.getTargetOwnerId(targetType, targetId);
    if (!ownerId || ownerId === userId) {
      return false;
    }

    const membership = await this.memberDao.findMembership(communityId, userId);
    if (!membership || (membership.role !== 'owner' && membership.role !== 'mentor')) {
      return false;
    }

    const ownerMembership = await this.memberDao.findMembership(communityId, ownerId);
    return ownerMembership !== null;
  }

  async getCommentCommunities(
    userId: string,
    targetType: CommentTargetType,
    targetId: string,
  ): Promise<Array<{ id: string; name: string }>> {
    const ownerId = await this.getTargetOwnerId(targetType, targetId);
    if (!ownerId || ownerId === userId) {
      return [];
    }
    return this.memberDao.findSharedMentorCommunities(userId, ownerId);
  }

  async canReplyToComment(
    userId: string,
    targetType: CommentTargetType,
    targetId: string,
    parentAuthorId: string,
    communityId: string,
  ): Promise<boolean> {
    const ownerId = await this.getTargetOwnerId(targetType, targetId);
    if (!ownerId) {
      return false;
    }

    if (ownerId === userId) {
      return true;
    }

    const membership = await this.memberDao.findMembership(communityId, userId);
    if (!membership || (membership.role !== 'owner' && membership.role !== 'mentor')) {
      return false;
    }

    if (parentAuthorId === userId) {
      return true;
    }

    const ownerMembership = await this.memberDao.findMembership(communityId, ownerId);
    return ownerMembership !== null;
  }

  async canModerateComment(
    userId: string,
    communityId: string,
  ): Promise<boolean> {
    const membership = await this.memberDao.findMembership(communityId, userId);
    return membership?.role === 'owner' || membership?.role === 'mentor';
  }
}
