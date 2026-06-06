import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import { aggregate, money, ratio, toStat } from '@/modules/analytics/analytics.util';
import {
  LEADERBOARD_DEFAULT_DAYS,
  type CommunityMemberRole,
} from '../constants/community.constants';
import { CommunityDao } from '../daos/community.dao';
import { CommunityInvitationDao } from '../daos/community-invitation.dao';
import { CommunityMemberDao } from '../daos/community-member.dao';
import { CommunityStatsDao } from '../daos/community-stats.dao';
import {
  type CommunityDetailDto,
  type CommunityMemberDto,
  type CommunitySummaryDto,
  toCommunityDetailDto,
  toCommunitySummaryDto,
} from '../dtos/community.dto';
import {
  type CommunityInvitationDto,
  toInvitationDto,
} from '../dtos/community-invitation.dto';
import {
  type CommunityLeaderboardDto,
  type CommunityLeaderboardEntryDto,
  type CommunityStatsDto,
} from '../dtos/community-leaderboard.dto';
import type { CreateCommunityDto } from '../dtos/create-community.dto';
import type { CreateInvitationDto } from '../dtos/create-invitation.dto';
import type { UpdateCommunityDto } from '../dtos/update-community.dto';
import { PrivacyUserDao } from '@/modules/privacy/daos/privacy-user.dao';
import { DELETED_USER_DISPLAY_NAME } from '@/modules/privacy/constants/privacy.constants';
import {
  collectAvatarSources,
  resolveAvatarUrlsForUsers,
} from '@/modules/privacy/utils/resolve-user-avatar.util';
import { sanitizeInvitationDto } from '@/modules/privacy/utils/sanitize-user.util';
import { StorageService } from '@/modules/storage/storage.service';

const INVITE_TOKEN_LENGTH = 21;

@Injectable()
export class CommunityService {
  constructor(
    private readonly communityDao: CommunityDao,
    private readonly memberDao: CommunityMemberDao,
    private readonly invitationDao: CommunityInvitationDao,
    private readonly statsDao: CommunityStatsDao,
    private readonly privacyUserDao: PrivacyUserDao,
    private readonly storage: StorageService,
  ) {}

  async list(userId: string): Promise<CommunitySummaryDto[]> {
    const rows = await this.communityDao.findAllForMember(userId);
    return rows.map(toCommunitySummaryDto);
  }

  async getById(id: string, userId: string): Promise<CommunityDetailDto> {
    const community = await this.communityDao.findById(id);
    if (!community) {
      throw new NotFoundException(`Community ${id} not found`);
    }

    const membership = await this.memberDao.findMembership(id, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this community');
    }

    const memberCount = await this.memberDao.countByCommunity(id);
    const rows = await this.memberDao.findMembersWithProfiles(id);
    const deletedUserIds = await this.privacyUserDao.findDeletedUserIds(
      rows.map((member) => member.userId),
    );
    const avatarUrls = await resolveAvatarUrlsForUsers(
      this.storage,
      collectAvatarSources(
        rows.map((member) => ({
          userId: member.userId,
          userImage: member.userImage,
          avatarStorageKey: member.avatarStorageKey,
        })),
      ),
    );
    const members: CommunityMemberDto[] = rows.map((m) => ({
      id: m.id,
      userId: m.userId,
      displayName: deletedUserIds.has(m.userId)
        ? DELETED_USER_DISPLAY_NAME
        : m.displayName,
      avatarUrl: deletedUserIds.has(m.userId)
        ? null
        : (avatarUrls.get(m.userId) ?? null),
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return toCommunityDetailDto(community, memberCount, membership.role, members);
  }

  async create(userId: string, dto: CreateCommunityDto): Promise<CommunityDetailDto> {
    return this.communityDao.transaction(async (trx) => {
      const communityDao = this.communityDao.transacting(trx);
      const memberDao = this.memberDao.transacting(trx);

      const community = await communityDao.create({
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        createdBy: userId,
      });
      if (!community) {
        throw new NotFoundException('Failed to create community');
      }

      await memberDao.create({
        communityId: community.id,
        userId,
        role: 'owner',
      });

      return toCommunityDetailDto(community, 1, 'owner');
    });
  }

  async update(id: string, userId: string, dto: UpdateCommunityDto): Promise<CommunityDetailDto> {
    await this.requireOwner(id, userId);

    const community = await this.communityDao.update(id, {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.description !== undefined && {
        description: dto.description?.trim() ?? null,
      }),
    });
    if (!community) {
      throw new NotFoundException(`Community ${id} not found`);
    }

    return this.getById(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.requireOwner(id, userId);
    const deleted = await this.communityDao.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Community ${id} not found`);
    }
  }

  async createInvitation(
    communityId: string,
    userId: string,
    dto: CreateInvitationDto,
  ): Promise<CommunityInvitationDto> {
    await this.requireMentorOrOwner(communityId, userId);

    const email = dto.email.trim().toLowerCase();
    const invitee = await this.invitationDao.findUserByEmail(email);
    if (!invitee) {
      throw new BadRequestException(`No user found with email ${dto.email}`);
    }

    if (invitee.id === userId) {
      throw new BadRequestException('You cannot invite yourself');
    }

    const existingMember = await this.memberDao.findMembership(communityId, invitee.id);
    if (existingMember) {
      throw new BadRequestException('User is already a member of this community');
    }

    const pending = await this.invitationDao.findPendingDuplicate(communityId, invitee.id);
    if (pending) {
      throw new BadRequestException('A pending invitation already exists for this user');
    }

    const invitation = await this.invitationDao.create({
      communityId,
      invitedBy: userId,
      inviteeEmail: email,
      inviteeUserId: invitee.id,
      role: dto.role,
      status: 'pending',
      token: nanoid(INVITE_TOKEN_LENGTH),
    });
    if (!invitation) {
      throw new NotFoundException('Failed to create invitation');
    }

    const community = await this.communityDao.findById(communityId);
    return sanitizeInvitationDto(
      toInvitationDto({
        id: invitation.id,
        communityId,
        communityName: community?.name ?? '',
        invitedBy: userId,
        inviterName: null,
        inviteeEmail: email,
        inviteeUserId: invitee.id,
        role: dto.role,
        status: 'pending',
        token: invitation.token,
        createdAt: invitation.createdAt,
        respondedAt: null,
      }),
      userId,
      { canViewInviteeEmail: true },
    );
  }

  async listInvitations(communityId: string, userId: string): Promise<CommunityInvitationDto[]> {
    await this.requireMentorOrOwner(communityId, userId);
    const rows = await this.invitationDao.findPendingByCommunity(communityId);
    return rows.map((row) =>
      sanitizeInvitationDto(toInvitationDto(row), userId, { canViewInviteeEmail: true }),
    );
  }

  async listMyInvitations(userId: string): Promise<CommunityInvitationDto[]> {
    const email = await this.invitationDao.findUserEmail(userId);
    if (!email) {
      return [];
    }
    const rows = await this.invitationDao.findPendingForUser(userId, email);
    return rows.map((row) => sanitizeInvitationDto(toInvitationDto(row), userId));
  }

  async acceptInvitation(invitationId: string, userId: string): Promise<CommunityDetailDto> {
    const invitation = await this.invitationDao.findById(invitationId);
    if (!invitation || invitation.status !== 'pending') {
      throw new NotFoundException(`Invitation ${invitationId} not found`);
    }

    const email = await this.invitationDao.findUserEmail(userId);
    const isInvitee =
      invitation.inviteeUserId === userId ||
      (email !== null &&
        invitation.inviteeEmail?.toLowerCase() === email.toLowerCase());
    if (!isInvitee) {
      throw new ForbiddenException('This invitation is not for you');
    }

    const existingMember = await this.memberDao.findMembership(
      invitation.communityId,
      userId,
    );
    if (existingMember) {
      throw new BadRequestException('You are already a member of this community');
    }

    await this.communityDao.transaction(async (trx) => {
      const memberDao = this.memberDao.transacting(trx);
      const invitationDao = this.invitationDao.transacting(trx);

      await memberDao.create({
        communityId: invitation.communityId,
        userId,
        role: invitation.role,
      });

      await invitationDao.updateStatus(invitationId, 'accepted');

      if (!invitation.inviteeUserId) {
        await invitationDao.update(invitationId, { inviteeUserId: userId });
      }
    });

    return this.getById(invitation.communityId, userId);
  }

  async rejectInvitation(invitationId: string, userId: string): Promise<CommunityInvitationDto> {
    const invitation = await this.invitationDao.findById(invitationId);
    if (!invitation || invitation.status !== 'pending') {
      throw new NotFoundException(`Invitation ${invitationId} not found`);
    }

    const email = await this.invitationDao.findUserEmail(userId);
    const isInvitee =
      invitation.inviteeUserId === userId ||
      (email !== null &&
        invitation.inviteeEmail?.toLowerCase() === email.toLowerCase());
    if (!isInvitee) {
      throw new ForbiddenException('This invitation is not for you');
    }

    const updated = await this.invitationDao.updateStatus(invitationId, 'rejected');
    if (!updated) {
      throw new NotFoundException(`Invitation ${invitationId} not found`);
    }

    const community = await this.communityDao.findById(invitation.communityId);
    return sanitizeInvitationDto(
      toInvitationDto({
        id: updated.id,
        communityId: updated.communityId,
        communityName: community?.name ?? '',
        invitedBy: updated.invitedBy,
        inviterName: null,
        inviteeEmail: updated.inviteeEmail,
        inviteeUserId: updated.inviteeUserId,
        role: updated.role,
        status: updated.status,
        token: updated.token,
        createdAt: updated.createdAt,
        respondedAt: updated.respondedAt,
      }),
      userId,
    );
  }

  async getLeaderboard(
    communityId: string,
    userId: string,
    days = LEADERBOARD_DEFAULT_DAYS,
  ): Promise<CommunityLeaderboardDto> {
    await this.requireMentorOrOwner(communityId, userId);

    const members = await this.memberDao.findMembersWithProfiles(communityId);
    const deletedUserIds = await this.privacyUserDao.findDeletedUserIds(
      members.map((member) => member.userId),
    );
    const periodDays = days;
    const dateFrom = new Date();
    dateFrom.setUTCDate(dateFrom.getUTCDate() - periodDays);

    const userIds = members.map((m) => m.userId);
    const trades = await this.statsDao.findClosedTradesForUsers(userIds, dateFrom);

    const tradesByUser = new Map<string, typeof trades>();
    for (const t of trades) {
      const list = tradesByUser.get(t.userId) ?? [];
      list.push(t);
      tradesByUser.set(t.userId, list);
    }

    const avatarUrls = await resolveAvatarUrlsForUsers(
      this.storage,
      collectAvatarSources(
        members.map((member) => ({
          userId: member.userId,
          userImage: member.userImage,
          avatarStorageKey: member.avatarStorageKey,
        })),
      ),
    );

    const entries: CommunityLeaderboardEntryDto[] = members
      .filter((m) => m.role !== 'owner' || members.length === 1)
      .map((member) => {
        const userTrades = tradesByUser.get(member.userId) ?? [];
        const stats = aggregate(userTrades.map(toStat));
        return {
          rank: 0,
          userId: member.userId,
          displayName: deletedUserIds.has(member.userId)
            ? DELETED_USER_DISPLAY_NAME
            : member.displayName,
          avatarUrl: deletedUserIds.has(member.userId)
            ? null
            : (avatarUrls.get(member.userId) ?? null),
          role: member.role,
          netPnl: money(stats.netPnl),
          winRate: ratio(stats.winRate),
          tradeCount: stats.totalTrades,
          profitFactor: stats.profitFactor === null ? null : ratio(stats.profitFactor),
        };
      })
      .sort((a, b) => b.netPnl - a.netPnl)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return { periodDays, entries };
  }

  async getStats(
    communityId: string,
    userId: string,
    days = LEADERBOARD_DEFAULT_DAYS,
  ): Promise<CommunityStatsDto> {
    await this.requireMentorOrOwner(communityId, userId);

    const memberCount = await this.memberDao.countByCommunity(communityId);
    const userIds = await this.memberDao.findMemberUserIds(communityId);
    const periodDays = days;
    const dateFrom = new Date();
    dateFrom.setUTCDate(dateFrom.getUTCDate() - periodDays);

    const trades = await this.statsDao.findClosedTradesForUsers(userIds, dateFrom);
    const activeUserIds = new Set(trades.map((t) => t.userId));
    const stats = aggregate(trades.map(toStat));

    return {
      memberCount,
      activeTraders: activeUserIds.size,
      aggregateNetPnl: money(stats.netPnl),
      periodDays,
    };
  }

  private isMentorOrOwner(role: string): role is CommunityMemberRole {
    return role === 'owner' || role === 'mentor';
  }

  private async requireMembership(communityId: string, userId: string) {
    const membership = await this.memberDao.findMembership(communityId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this community');
    }
    return membership;
  }

  private async requireOwner(communityId: string, userId: string) {
    const membership = await this.requireMembership(communityId, userId);
    if (membership.role !== 'owner') {
      throw new ForbiddenException('Only the community owner can perform this action');
    }
    return membership;
  }

  private async requireMentorOrOwner(communityId: string, userId: string) {
    const membership = await this.requireMembership(communityId, userId);
    if (!this.isMentorOrOwner(membership.role)) {
      throw new ForbiddenException('Only mentors and owners can perform this action');
    }
    return membership;
  }
}
