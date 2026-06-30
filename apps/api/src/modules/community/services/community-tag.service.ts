import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommunityMemberDao } from '../daos/community-member.dao';
import { CommunityMemberTagDao } from '../daos/community-member-tag.dao';
import { CommunityTagDao } from '../daos/community-tag.dao';
import {
  type CommunityMemberDto,
  type CommunityMemberWithTagsDto,
} from '../dtos/community.dto';
import {
  type CommunityTagDto,
  toCommunityTagDto,
} from '../dtos/community-tag.dto';
import type { CreateCommunityTagDto } from '../dtos/create-community-tag.dto';
import type { UpdateCommunityTagDto } from '../dtos/update-community-tag.dto';
import type { CommunityMembersQueryDto } from '../dtos/community-members-query.dto';
import { PrivacyUserDao } from '@/modules/privacy/daos/privacy-user.dao';
import { DELETED_USER_DISPLAY_NAME } from '@/modules/privacy/constants/privacy.constants';
import {
  collectAvatarSources,
  collectHeaderSources,
  resolveAvatarUrlsForUsers,
  resolveHeaderUrlsForUsers,
} from '@/modules/privacy/utils/resolve-user-avatar.util';
import { StorageService } from '@/modules/storage/storage.service';
import type { CommunityMemberRole } from '../constants/community.constants';

@Injectable()
export class CommunityTagService {
  constructor(
    private readonly tagDao: CommunityTagDao,
    private readonly memberTagDao: CommunityMemberTagDao,
    private readonly memberDao: CommunityMemberDao,
    private readonly privacyUserDao: PrivacyUserDao,
    private readonly storage: StorageService,
  ) {}

  async listTags(communityId: string, userId: string): Promise<CommunityTagDto[]> {
    await this.requireMembership(communityId, userId);
    const rows = await this.tagDao.findByCommunity(communityId);
    return rows.map(toCommunityTagDto);
  }

  async createTag(
    communityId: string,
    userId: string,
    dto: CreateCommunityTagDto,
  ): Promise<CommunityTagDto> {
    await this.requireMentorOrOwner(communityId, userId);

    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Tag name is required');
    }

    const row = await this.tagDao.create({
      communityId,
      name,
      color: dto.color ?? null,
      createdBy: userId,
    });
    if (!row) {
      throw new NotFoundException('Failed to create tag');
    }
    return toCommunityTagDto(row);
  }

  async updateTag(
    communityId: string,
    tagId: string,
    userId: string,
    dto: UpdateCommunityTagDto,
  ): Promise<CommunityTagDto> {
    await this.requireMentorOrOwner(communityId, userId);

    const row = await this.tagDao.updateInCommunity(tagId, communityId, {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.color !== undefined && { color: dto.color }),
    });
    if (!row) {
      throw new NotFoundException(`Tag ${tagId} not found`);
    }
    return toCommunityTagDto(row);
  }

  async removeTag(communityId: string, tagId: string, userId: string): Promise<void> {
    await this.requireMentorOrOwner(communityId, userId);
    const deleted = await this.tagDao.deleteInCommunity(tagId, communityId);
    if (!deleted) {
      throw new NotFoundException(`Tag ${tagId} not found`);
    }
  }

  async setMemberTags(
    communityId: string,
    memberUserId: string,
    userId: string,
    tagIds: string[],
  ): Promise<CommunityMemberWithTagsDto> {
    await this.requireMentorOrOwner(communityId, userId);

    const member = await this.memberDao.findMembership(communityId, memberUserId);
    if (!member) {
      throw new NotFoundException(`Member ${memberUserId} not found in this community`);
    }

    const uniqueTagIds = [...new Set(tagIds)];
    if (uniqueTagIds.length > 0) {
      const communityTags = await this.tagDao.findByCommunity(communityId);
      const validIds = new Set(communityTags.map((t) => t.id));
      const invalid = uniqueTagIds.filter((id) => !validIds.has(id));
      if (invalid.length > 0) {
        throw new BadRequestException('One or more tags do not belong to this community');
      }
    }

    await this.memberTagDao.replaceMemberTags(member.id, uniqueTagIds);

    const members = await this.listMembers(communityId, userId, {});
    const updated = members.find((m) => m.userId === memberUserId);
    if (!updated) {
      throw new NotFoundException(`Member ${memberUserId} not found`);
    }
    return updated;
  }

  async listMembers(
    communityId: string,
    userId: string,
    query: CommunityMembersQueryDto,
  ): Promise<CommunityMemberWithTagsDto[]> {
    await this.requireMembership(communityId, userId);

    const rows = await this.memberDao.findMembersWithProfiles(communityId);
    const memberIds = rows.map((m) => m.id);
    const tagRows = await this.memberTagDao.findTagsByMemberIds(memberIds);
    const tagsByMember = new Map<string, CommunityTagDto[]>();
    for (const row of tagRows) {
      const list = tagsByMember.get(row.communityMemberId) ?? [];
      list.push(toCommunityTagDto(row.tag));
      tagsByMember.set(row.communityMemberId, list);
    }

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

    let members: CommunityMemberWithTagsDto[] = rows.map((m) => ({
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
      tags: tagsByMember.get(m.id) ?? [],
    }));

    const search = query.search?.trim().toLowerCase();
    if (search) {
      members = members.filter((m) => m.displayName.toLowerCase().includes(search));
    }

    const filterTagIds = query.tag ?? [];
    if (filterTagIds.length > 0) {
      members = members.filter((m) =>
        filterTagIds.every((tagId) => m.tags.some((t) => t.id === tagId)),
      );
    }

    return members;
  }

  async enrichMembersWithTags(
    members: CommunityMemberDto[],
  ): Promise<CommunityMemberWithTagsDto[]> {
    if (members.length === 0) {
      return [];
    }

    const memberIds = members.map((m) => m.id);
    const tagRows = await this.memberTagDao.findTagsByMemberIds(memberIds);
    const tagsByMember = new Map<string, CommunityTagDto[]>();
    for (const row of tagRows) {
      const list = tagsByMember.get(row.communityMemberId) ?? [];
      list.push(toCommunityTagDto(row.tag));
      tagsByMember.set(row.communityMemberId, list);
    }

    return members.map((m) => ({
      ...m,
      tags: tagsByMember.get(m.id) ?? [],
    }));
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

  private async requireMentorOrOwner(communityId: string, userId: string) {
    const membership = await this.requireMembership(communityId, userId);
    if (!this.isMentorOrOwner(membership.role)) {
      throw new ForbiddenException('Only mentors and owners can perform this action');
    }
    return membership;
  }
}
