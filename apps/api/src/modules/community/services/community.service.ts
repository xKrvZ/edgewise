import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import { aggregate, money, ratio, toStat } from '@/modules/analytics/analytics.util';
import {
  LEADERBOARD_DEFAULT_DAYS,
  MAX_COMMUNITY_HEADER_BYTES,
  MAX_COMMUNITY_LOGO_BYTES,
  COMMUNITY_IMAGE_TYPES,
  type CommunityMemberRole,
  type CommunityLeaderboardVisibility,
} from '../constants/community.constants';
import { CommunityDao } from '../daos/community.dao';
import { CommunityBanDao } from '../daos/community-ban.dao';
import { CommunityInvitationDao } from '../daos/community-invitation.dao';
import { CommunityMemberDao } from '../daos/community-member.dao';
import { CommunityStatsDao } from '../daos/community-stats.dao';
import {
  type CommunityDetailDto,
  type CommunityMemberDto,
  type CommunityPendingInvitationDto,
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
import type { CommunityListQueryDto } from '../dtos/community-list-query.dto';
import {
  type CommunityBannedMemberDto,
  type BanCommunityMemberDto,
} from '../dtos/community-ban.dto';
import {
  type CommunityHeaderUploadRequestDto,
  type CommunityLogoUploadRequestDto,
  type CommunityUploadTargetDto,
} from '../dtos/community-upload.dto';
import type { Selectable } from 'kysely';
import type { Community } from '@/database/types/db';
import { PrivacyUserDao } from '@/modules/privacy/daos/privacy-user.dao';
import { DELETED_USER_DISPLAY_NAME } from '@/modules/privacy/constants/privacy.constants';
import {
  collectAvatarSources,
  collectHeaderSources,
  resolveAvatarUrlsForUsers,
  resolveHeaderUrlsForUsers,
} from '@/modules/privacy/utils/resolve-user-avatar.util';
import { sanitizeInvitationDto } from '@/modules/privacy/utils/sanitize-user.util';
import { AccountLimitService } from '@/modules/billing/services/account-limit.service';
import { StorageService } from '@/modules/storage/storage.service';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { TradeService } from '@/modules/trade/services/trade.service';
import { TradeDto } from '@/modules/trade/dtos/trade.dto';
import { TradeQueryDto } from '@/modules/trade/dtos/trade-query.dto';
import { CommunityTagService } from './community-tag.service';
import {
  isLikelyHtmlContent,
  normalizePostContentForStorage,
  resolvePostContentImageUrls,
} from '../utils/community-post-content.util';

const INVITE_TOKEN_LENGTH = 21;

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    private readonly communityDao: CommunityDao,
    private readonly banDao: CommunityBanDao,
    private readonly memberDao: CommunityMemberDao,
    private readonly invitationDao: CommunityInvitationDao,
    private readonly statsDao: CommunityStatsDao,
    private readonly privacyUserDao: PrivacyUserDao,
    private readonly storage: StorageService,
    private readonly accountLimitService: AccountLimitService,
    private readonly communityTagService: CommunityTagService,
    private readonly tradeService: TradeService,
  ) {}

  async list(userId: string, query?: CommunityListQueryDto): Promise<CommunitySummaryDto[]> {
    const rows = await this.communityDao.findAllWithMembership(userId, {
      featured: query?.featured,
      search: query?.search,
    });
    const pendingByCommunity = await this.resolvePendingInvitationsByCommunity(userId);
    const summaries = await Promise.all(
      rows.map(async (row) => {
        const imageUrls = await this.resolveCommunityImageUrls(row);
        const aboutContent = await this.resolveAboutContent(row.aboutContent);
        const pendingInvitation =
          row.memberRole === null ? (pendingByCommunity.get(row.id) ?? null) : null;
        return toCommunitySummaryDto({ ...row, aboutContent }, imageUrls, pendingInvitation);
      }),
    );
    return summaries;
  }

  async getById(id: string, userId: string): Promise<CommunityDetailDto> {
    const community = await this.communityDao.findById(id);
    if (!community) {
      throw new NotFoundException(`Community ${id} not found`);
    }

    const membership = await this.memberDao.findMembership(id, userId);
    const memberCount = await this.memberDao.countByCommunity(id);
    const imageUrls = await this.resolveCommunityImageUrls(community);
    const aboutContent = await this.resolveAboutContent(community.aboutContent);
    const pendingInvitation = membership
      ? null
      : await this.resolvePendingInvitationForCommunity(id, userId);

    if (!membership) {
      return toCommunityDetailDto(
        { ...community, aboutContent },
        memberCount,
        null,
        undefined,
        imageUrls,
        pendingInvitation,
      );
    }

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
    const headerUrls = await resolveHeaderUrlsForUsers(
      this.storage,
      collectHeaderSources(
        rows.map((member) => ({
          userId: member.userId,
          headerStorageKey: member.headerStorageKey,
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
      headerUrl: deletedUserIds.has(m.userId)
        ? null
        : (headerUrls.get(m.userId) ?? null),
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    const membersWithTags = await this.communityTagService.enrichMembersWithTags(members);

    return toCommunityDetailDto(
      { ...community, aboutContent },
      memberCount,
      membership.role,
      membersWithTags,
      imageUrls,
      pendingInvitation,
    );
  }

  async create(
    userId: string,
    dto: CreateCommunityDto,
    email?: string | null,
    role?: string | string[] | null,
  ): Promise<CommunityDetailDto> {
    await this.accountLimitService.assertCanCreateCommunity(userId, email, role);

    return this.communityDao.transaction(async (trx) => {
      const communityDao = this.communityDao.transacting(trx);
      const memberDao = this.memberDao.transacting(trx);

      const community = await communityDao.create({
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        createdBy: userId,
        joinPolicy: dto.joinPolicy ?? 'invite_only',
        leaderboardVisibility: dto.leaderboardVisibility ?? 'mentors',
      });
      if (!community) {
        throw new NotFoundException('Failed to create community');
      }

      await memberDao.create({
        communityId: community.id,
        userId,
        role: 'owner',
      });

      return toCommunityDetailDto(community, 1, 'owner', undefined, {
        logoUrl: null,
        headerUrl: null,
      });
    });
  }

  async update(id: string, userId: string, dto: UpdateCommunityDto): Promise<CommunityDetailDto> {
    await this.requireOwner(id, userId);

    const existing = await this.communityDao.findById(id);
    if (!existing) {
      throw new NotFoundException(`Community ${id} not found`);
    }

    if (dto.logoStorageKey !== undefined) {
      await this.applyCommunityStorageKeyUpdate(
        id,
        'logo',
        existing.logoStorageKey,
        dto.logoStorageKey,
      );
    }

    if (dto.headerStorageKey !== undefined) {
      await this.applyCommunityStorageKeyUpdate(
        id,
        'header',
        existing.headerStorageKey,
        dto.headerStorageKey,
      );
    }

    const community = await this.communityDao.update(id, {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.description !== undefined && {
        description: dto.description?.trim() ?? null,
      }),
      ...(dto.joinPolicy !== undefined && { joinPolicy: dto.joinPolicy }),
      ...(dto.leaderboardVisibility !== undefined && {
        leaderboardVisibility: dto.leaderboardVisibility,
      }),
      ...(dto.websiteUrl !== undefined && {
        websiteUrl: dto.websiteUrl?.trim() || null,
      }),
      ...(dto.discordUrl !== undefined && {
        discordUrl: dto.discordUrl?.trim() || null,
      }),
      ...(dto.instagramUrl !== undefined && {
        instagramUrl: dto.instagramUrl?.trim() || null,
      }),
      ...(dto.tiktokUrl !== undefined && {
        tiktokUrl: dto.tiktokUrl?.trim() || null,
      }),
      ...(dto.youtubeUrl !== undefined && {
        youtubeUrl: dto.youtubeUrl?.trim() || null,
      }),
      ...(dto.aboutContent !== undefined && {
        aboutContent: dto.aboutContent?.trim()
          ? normalizePostContentForStorage(dto.aboutContent.trim())
          : null,
      }),
      ...(dto.logoStorageKey !== undefined && { logoStorageKey: dto.logoStorageKey }),
      ...(dto.headerStorageKey !== undefined && { headerStorageKey: dto.headerStorageKey }),
    });
    if (!community) {
      throw new NotFoundException(`Community ${id} not found`);
    }

    return this.getById(id, userId);
  }

  async requestLogoUpload(
    communityId: string,
    userId: string,
    dto: CommunityLogoUploadRequestDto,
  ): Promise<CommunityUploadTargetDto> {
    await this.requireOwner(communityId, userId);
    this.assertCommunityImage(dto.contentType, dto.sizeBytes, MAX_COMMUNITY_LOGO_BYTES);

    const storageKey = this.storage.buildCommunityKey(communityId, 'logo', dto.filename);
    return this.buildUploadTarget(storageKey, dto.contentType);
  }

  async requestHeaderUpload(
    communityId: string,
    userId: string,
    dto: CommunityHeaderUploadRequestDto,
  ): Promise<CommunityUploadTargetDto> {
    await this.requireOwner(communityId, userId);
    this.assertCommunityImage(dto.contentType, dto.sizeBytes, MAX_COMMUNITY_HEADER_BYTES);

    const storageKey = this.storage.buildCommunityKey(communityId, 'header', dto.filename);
    return this.buildUploadTarget(storageKey, dto.contentType);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.requireOwner(id, userId);
    const existing = await this.communityDao.findById(id);
    if (!existing) {
      throw new NotFoundException(`Community ${id} not found`);
    }

    if (existing.logoStorageKey) {
      await this.deleteStorageObject(existing.logoStorageKey);
    }
    if (existing.headerStorageKey) {
      await this.deleteStorageObject(existing.headerStorageKey);
    }

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

    if (!dto.email && !dto.userId) {
      throw new BadRequestException('Either email or userId is required');
    }

    const invitee = dto.userId
      ? await this.invitationDao.findUserById(dto.userId)
      : await this.invitationDao.findUserByEmail(dto.email!.trim());
    if (!invitee) {
      throw new BadRequestException(
        dto.userId ? `No user found with id ${dto.userId}` : `No user found with email ${dto.email}`,
      );
    }

    const email = invitee.email.trim().toLowerCase();

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
    return Promise.all(
      rows.map(async (row) => {
        const community = await this.communityDao.findById(row.communityId);
        const imageUrls = community
          ? await this.resolveCommunityImageUrls(community)
          : { logoUrl: null, headerUrl: null };
        return sanitizeInvitationDto(
          {
            ...toInvitationDto(row),
            logoUrl: imageUrls.logoUrl,
          },
          userId,
        );
      }),
    );
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

    await this.assertNotBanned(invitation.communityId, userId);

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

  async join(communityId: string, userId: string): Promise<CommunityDetailDto> {
    const community = await this.communityDao.findById(communityId);
    if (!community) {
      throw new NotFoundException(`Community ${communityId} not found`);
    }

    if (community.joinPolicy !== 'public') {
      throw new ForbiddenException('This community is invite-only');
    }

    const existingMember = await this.memberDao.findMembership(communityId, userId);
    if (existingMember) {
      throw new BadRequestException('You are already a member of this community');
    }

    await this.assertNotBanned(communityId, userId);

    const member = await this.memberDao.create({
      communityId,
      userId,
      role: 'member',
    });
    if (!member) {
      throw new NotFoundException('Failed to join community');
    }

    return this.getById(communityId, userId);
  }

  async leave(communityId: string, userId: string): Promise<void> {
    const community = await this.communityDao.findById(communityId);
    if (!community) {
      throw new NotFoundException(`Community ${communityId} not found`);
    }

    const membership = await this.requireMembership(communityId, userId);
    if (membership.role === 'owner') {
      throw new ForbiddenException(
        'Community owners cannot leave. Delete the community or transfer ownership first.',
      );
    }

    const deleted = await this.memberDao.deleteByCommunityAndUser(communityId, userId);
    if (!deleted) {
      throw new NotFoundException('Membership not found');
    }
  }

  async kickMember(
    communityId: string,
    actorUserId: string,
    targetUserId: string,
  ): Promise<void> {
    await this.removeMember(communityId, actorUserId, targetUserId);
  }

  async banMember(
    communityId: string,
    actorUserId: string,
    targetUserId: string,
    dto?: BanCommunityMemberDto,
  ): Promise<void> {
    const reason = dto?.reason?.trim() || null;

    await this.communityDao.transaction(async (trx) => {
      const memberDao = this.memberDao.transacting(trx);
      const banDao = this.banDao.transacting(trx);

      await this.removeMember(communityId, actorUserId, targetUserId, {
        memberDao,
      });

      const existingBan = await banDao.findBan(communityId, targetUserId);
      if (existingBan) {
        return;
      }

      const ban = await banDao.create({
        communityId,
        userId: targetUserId,
        bannedBy: actorUserId,
        reason,
      });
      if (!ban) {
        throw new NotFoundException('Failed to ban member');
      }
    });
  }

  async unbanMember(
    communityId: string,
    actorUserId: string,
    targetUserId: string,
  ): Promise<void> {
    await this.requireMentorOrOwner(communityId, actorUserId);

    const deleted = await this.banDao.deleteByCommunityAndUser(communityId, targetUserId);
    if (!deleted) {
      throw new NotFoundException('Ban not found');
    }
  }

  async listBannedMembers(
    communityId: string,
    actorUserId: string,
  ): Promise<CommunityBannedMemberDto[]> {
    await this.requireMentorOrOwner(communityId, actorUserId);

    const rows = await this.banDao.findBansWithProfiles(communityId);
    const deletedUserIds = await this.privacyUserDao.findDeletedUserIds(
      rows.flatMap((row) => [row.userId, row.bannedBy]),
    );
    const avatarUrls = await resolveAvatarUrlsForUsers(
      this.storage,
      collectAvatarSources(
        rows.map((row) => ({
          userId: row.userId,
          userImage: row.userImage,
          avatarStorageKey: row.avatarStorageKey,
        })),
      ),
    );

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      displayName: deletedUserIds.has(row.userId)
        ? DELETED_USER_DISPLAY_NAME
        : row.displayName,
      avatarUrl: deletedUserIds.has(row.userId)
        ? null
        : (avatarUrls.get(row.userId) ?? null),
      bannedBy: row.bannedBy,
      bannedByDisplayName: deletedUserIds.has(row.bannedBy)
        ? DELETED_USER_DISPLAY_NAME
        : row.bannedByDisplayName,
      bannedAt: row.bannedAt,
      reason: row.reason,
    }));
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
    await this.requireLeaderboardAccess(communityId, userId);

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

  async getMemberTrades(
    communityId: string,
    viewerId: string,
    memberUserId: string,
    query: TradeQueryDto,
  ): Promise<PaginatedDto<TradeDto>> {
    await this.requireMentorOrOwner(communityId, viewerId);

    const memberMembership = await this.memberDao.findMembership(
      communityId,
      memberUserId,
    );
    if (!memberMembership) {
      throw new NotFoundException(
        `Member ${memberUserId} not found in this community`,
      );
    }

    return this.tradeService.listForMember(memberUserId, query);
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

  private async requireLeaderboardAccess(communityId: string, userId: string) {
    const community = await this.communityDao.findById(communityId);
    if (!community) {
      throw new NotFoundException(`Community ${communityId} not found`);
    }

    const visibility = (community.leaderboardVisibility ??
      'mentors') as CommunityLeaderboardVisibility;

    if (visibility === 'public') {
      return;
    }

    const membership = await this.requireMembership(communityId, userId);

    if (visibility === 'members') {
      return;
    }

    if (!this.isMentorOrOwner(membership.role)) {
      throw new ForbiddenException('Only mentors and owners can view the leaderboard');
    }
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

  private async assertNotBanned(communityId: string, userId: string): Promise<void> {
    const ban = await this.banDao.findBan(communityId, userId);
    if (ban) {
      throw new ForbiddenException('You are banned from this community');
    }
  }

  private async removeMember(
    communityId: string,
    actorUserId: string,
    targetUserId: string,
    options?: { memberDao?: CommunityMemberDao },
  ): Promise<void> {
    const actorMembership = await this.requireMentorOrOwner(communityId, actorUserId);
    const targetMembership = await (options?.memberDao ?? this.memberDao).findMembership(
      communityId,
      targetUserId,
    );

    if (!targetMembership) {
      throw new NotFoundException('Member not found');
    }

    this.assertCanModerateTarget(actorMembership.role, targetMembership.role, actorUserId, targetUserId);

    const deleted = await (options?.memberDao ?? this.memberDao).deleteByCommunityAndUser(
      communityId,
      targetUserId,
    );
    if (!deleted) {
      throw new NotFoundException('Member not found');
    }
  }

  private assertCanModerateTarget(
    actorRole: string,
    targetRole: string,
    actorUserId: string,
    targetUserId: string,
  ): void {
    if (actorUserId === targetUserId) {
      throw new ForbiddenException('You cannot moderate yourself');
    }

    if (targetRole === 'owner') {
      throw new ForbiddenException('The community owner cannot be removed or banned');
    }

    if (actorRole === 'mentor' && targetRole !== 'member') {
      throw new ForbiddenException('Mentors can only moderate regular members');
    }
  }

  private async resolvePendingInvitationsByCommunity(
    userId: string,
  ): Promise<Map<string, CommunityPendingInvitationDto>> {
    const email = await this.invitationDao.findUserEmail(userId);
    if (!email) {
      return new Map();
    }

    const rows = await this.invitationDao.findPendingForUser(userId, email);
    return new Map(
      rows.map((row) => [row.communityId, { id: row.id, role: row.role } satisfies CommunityPendingInvitationDto]),
    );
  }

  private async resolvePendingInvitationForCommunity(
    communityId: string,
    userId: string,
  ): Promise<CommunityPendingInvitationDto | null> {
    const email = await this.invitationDao.findUserEmail(userId);
    if (!email) {
      return null;
    }

    const pending = await this.invitationDao.findPendingByCommunityAndUser(
      communityId,
      userId,
      email,
    );
    if (!pending) {
      return null;
    }

    return { id: pending.id, role: pending.role };
  }

  private async resolveAboutContent(aboutContent: string | null): Promise<string | null> {
    if (!aboutContent) {
      return null;
    }
    if (!isLikelyHtmlContent(aboutContent)) {
      return aboutContent;
    }
    return resolvePostContentImageUrls(this.storage, aboutContent);
  }

  private async resolveCommunityImageUrls(
    row: Pick<Selectable<Community>, 'logoStorageKey' | 'headerStorageKey'>,
  ): Promise<{ logoUrl: string | null; headerUrl: string | null }> {
    const [logoUrl, headerUrl] = await Promise.all([
      row.logoStorageKey ? this.storage.presignDownload(row.logoStorageKey) : null,
      row.headerStorageKey ? this.storage.presignDownload(row.headerStorageKey) : null,
    ]);
    return { logoUrl, headerUrl };
  }

  private assertCommunityImage(
    contentType: string,
    sizeBytes: number,
    maxBytes: number,
  ): void {
    if (!COMMUNITY_IMAGE_TYPES.includes(contentType as (typeof COMMUNITY_IMAGE_TYPES)[number])) {
      throw new BadRequestException(`Unsupported image content type: ${contentType}`);
    }
    if (sizeBytes > maxBytes) {
      const mb = Math.round(maxBytes / (1024 * 1024));
      throw new BadRequestException(`Image exceeds the maximum size of ${mb} MB`);
    }
  }

  private async buildUploadTarget(
    storageKey: string,
    contentType: string,
  ): Promise<CommunityUploadTargetDto> {
    const uploadUrl = await this.storage.presignUpload(storageKey, contentType);
    return {
      uploadUrl,
      storageKey,
      expiresIn: this.storage.uploadExpirySeconds,
    };
  }

  private async applyCommunityStorageKeyUpdate(
    communityId: string,
    asset: 'logo' | 'header',
    currentKey: string | null,
    nextKey: string | null,
  ): Promise<void> {
    if (nextKey === null) {
      if (currentKey) {
        await this.deleteStorageObject(currentKey);
      }
      return;
    }

    const prefix = asset === 'logo' ? 'community-logos/' : 'community-headers/';
    if (!nextKey.startsWith(`${prefix}${communityId}/`)) {
      throw new BadRequestException('Invalid storage key for this community asset');
    }

    if (currentKey && currentKey !== nextKey) {
      await this.deleteStorageObject(currentKey);
    }
  }

  private async deleteStorageObject(key: string): Promise<void> {
    try {
      await this.storage.deleteObject(key);
    } catch (error) {
      this.logger.warn(`Failed to delete object ${key}`, error as Error);
    }
  }
}
