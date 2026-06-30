import {

  BadRequestException,

  ForbiddenException,

  Injectable,

  NotFoundException,

} from '@nestjs/common';

import { CommunityMemberDao } from '../daos/community-member.dao';

import { CommunityPostDao } from '../daos/community-post.dao';

import { CommunityDao } from '../daos/community.dao';

import {

  type CommunityPostDetailDto,

  type CommunityPostSummaryDto,

  type PublicCommunityPostDetailDto,

  toCommunityPostDetailDto,

  toCommunityPostSummaryDto,

} from '../dtos/community-post.dto';

import type { CommunityPostsQueryDto } from '../dtos/community-posts-query.dto';
import type { CreateCommunityPostDto } from '../dtos/create-community-post.dto';

import type { UpdateCommunityPostDto } from '../dtos/update-community-post.dto';

import type {

  CommunityPostContentImageUploadRequestDto,

  CommunityPostContentUploadTargetDto,

  CommunityPostHeaderUploadRequestDto,

} from '../dtos/community-post-upload.dto';

import { CommunityUploadTargetDto } from '../dtos/community-upload.dto';

import type { CommunityMemberRole, CommunityPostVisibility } from '../constants/community.constants';

import {

  COMMUNITY_IMAGE_TYPES,

  MAX_COMMUNITY_POST_CONTENT_IMAGE_BYTES,

  MAX_COMMUNITY_POST_HEADER_BYTES,

} from '../constants/community.constants';

import { PrivacyUserDao } from '@/modules/privacy/daos/privacy-user.dao';

import { DELETED_USER_DISPLAY_NAME } from '@/modules/privacy/constants/privacy.constants';

import {

  collectAvatarSources,

  resolveAvatarUrlsForUsers,

} from '@/modules/privacy/utils/resolve-user-avatar.util';

import { StorageService } from '@/modules/storage/storage.service';

import {

  normalizePostContentForStorage,

  resolvePostContentImageUrls,

} from '../utils/community-post-content.util';



@Injectable()

export class CommunityPostService {

  constructor(

    private readonly postDao: CommunityPostDao,

    private readonly memberDao: CommunityMemberDao,

    private readonly communityDao: CommunityDao,

    private readonly privacyUserDao: PrivacyUserDao,

    private readonly storage: StorageService,

  ) {}



  async listPosts(

    communityId: string,

    userId: string,

    query?: CommunityPostsQueryDto,

  ): Promise<CommunityPostSummaryDto[]> {

    await this.requireMembership(communityId, userId);

    const rows = await this.postDao.findByCommunity(communityId, {

      excludePostId: query?.exclude,

      limit: query?.limit,

      includeDiscoverHidden: true,

    });

    return this.toSummaryDtos(rows);

  }



  async listPublicPosts(

    communityId: string,

    query?: CommunityPostsQueryDto,

  ): Promise<CommunityPostSummaryDto[]> {

    const community = await this.communityDao.findById(communityId);

    if (!community) {

      throw new NotFoundException(`Community ${communityId} not found`);

    }

    const rows = await this.postDao.findByCommunity(communityId, {

      visibility: 'public',

      excludePostId: query?.exclude,

      limit: query?.limit,

    });

    return this.toSummaryDtos(rows);

  }



  async getPost(

    communityId: string,

    postId: string,

    userId: string,

  ): Promise<CommunityPostDetailDto> {

    const row = await this.postDao.findByIdInCommunity(postId, communityId);

    if (!row) {

      throw new NotFoundException(`Post ${postId} not found`);

    }

    const canView = await this.canViewPost(row, userId);

    if (!canView) {

      throw new ForbiddenException('You do not have access to this post');

    }

    const [dto] = await this.toDetailDtos([row]);

    return dto;

  }



  async getPublicPost(

    communityId: string,

    postId: string,

  ): Promise<PublicCommunityPostDetailDto> {

    const row = await this.postDao.findByIdInCommunity(postId, communityId);

    if (!row) {

      throw new NotFoundException(`Post ${postId} not found`);

    }

    if (row.visibility !== 'public') {

      throw new NotFoundException(`Post ${postId} not found`);

    }

    const community = await this.communityDao.findById(communityId);

    if (!community) {

      throw new NotFoundException(`Community ${communityId} not found`);

    }

    const [dto] = await this.toDetailDtos([row]);

    return { ...dto, communityName: community.name };

  }



  async createPost(

    communityId: string,

    userId: string,

    dto: CreateCommunityPostDto,

  ): Promise<CommunityPostDetailDto> {

    await this.requireMentorOrOwner(communityId, userId);



    const title = dto.title.trim();

    const content = normalizePostContentForStorage(dto.content.trim());

    if (!title) {

      throw new BadRequestException('Title is required');

    }

    if (!content) {

      throw new BadRequestException('Content is required');

    }



    const headerStorageKey = this.normalizeHeaderStorageKey(dto.headerStorageKey);

    const visibility: CommunityPostVisibility = dto.visibility ?? 'private';

    const commentsEnabled = dto.commentsEnabled ?? true;



    const now = new Date();

    const row = await this.postDao.create({

      communityId,

      authorUserId: userId,

      title,

      content,

      headerStorageKey,

      visibility,

      commentsEnabled,

      publishedAt: now,

      createdAt: now,

      updatedAt: now,

    });

    if (!row) {

      throw new NotFoundException('Failed to create post');

    }



    const created = await this.postDao.findByIdInCommunity(row.id, communityId);

    if (!created) {

      throw new NotFoundException('Failed to load created post');

    }

    const [detail] = await this.toDetailDtos([created]);

    return detail;

  }



  async updatePost(

    communityId: string,

    postId: string,

    userId: string,

    dto: UpdateCommunityPostDto,

  ): Promise<CommunityPostDetailDto> {

    const existing = await this.postDao.findByIdInCommunity(postId, communityId);

    if (!existing) {

      throw new NotFoundException(`Post ${postId} not found`);

    }

    if (existing.deletedAt) {

      throw new BadRequestException('This post has been deleted');

    }



    await this.requireAuthorOrOwner(communityId, userId, existing.authorUserId);



    const title = dto.title !== undefined ? dto.title.trim() : undefined;

    const content =

      dto.content !== undefined ? normalizePostContentForStorage(dto.content.trim()) : undefined;

    if (title === '') {

      throw new BadRequestException('Title is required');

    }

    if (content === '') {

      throw new BadRequestException('Content is required');

    }



    let headerStorageKey: string | null | undefined;

    if (dto.headerStorageKey !== undefined) {

      headerStorageKey = this.normalizeHeaderStorageKey(dto.headerStorageKey);

      if (

        existing.headerStorageKey &&

        existing.headerStorageKey !== headerStorageKey

      ) {

        await this.deleteStorageObject(existing.headerStorageKey);

      }

    }



    const row = await this.postDao.updateInCommunity(postId, communityId, {

      ...(title !== undefined && { title }),

      ...(content !== undefined && { content }),

      ...(headerStorageKey !== undefined && { headerStorageKey }),

      ...(dto.visibility !== undefined && { visibility: dto.visibility }),

      ...(dto.commentsEnabled !== undefined && { commentsEnabled: dto.commentsEnabled }),

    });

    if (!row) {

      throw new NotFoundException(`Post ${postId} not found`);

    }



    const updated = await this.postDao.findByIdInCommunity(postId, communityId);

    if (!updated) {

      throw new NotFoundException(`Post ${postId} not found`);

    }

    const [detail] = await this.toDetailDtos([updated]);

    return detail;

  }



  async removePost(communityId: string, postId: string, userId: string): Promise<void> {

    const existing = await this.postDao.findByIdInCommunity(postId, communityId);

    if (!existing) {

      throw new NotFoundException(`Post ${postId} not found`);

    }



    await this.requireAuthorOrOwner(communityId, userId, existing.authorUserId);



    if (existing.deletedAt) {

      throw new BadRequestException('This post has already been deleted');

    }



    const deleted = await this.postDao.softDeleteInCommunity(postId, communityId);

    if (!deleted) {

      throw new NotFoundException(`Post ${postId} not found`);

    }

  }



  async requestPostHeaderUpload(

    communityId: string,

    userId: string,

    dto: CommunityPostHeaderUploadRequestDto,

  ): Promise<CommunityUploadTargetDto> {

    await this.requireMentorOrOwner(communityId, userId);

    this.assertPostImage(dto.contentType, dto.sizeBytes, MAX_COMMUNITY_POST_HEADER_BYTES);



    const storageKey = this.storage.buildCommunityPostKey(communityId, 'header', dto.filename);

    return this.buildUploadTarget(storageKey, dto.contentType);

  }



  async requestPostContentImageUpload(

    communityId: string,

    userId: string,

    dto: CommunityPostContentImageUploadRequestDto,

  ): Promise<CommunityPostContentUploadTargetDto> {

    await this.requireMentorOrOwner(communityId, userId);

    this.assertPostImage(

      dto.contentType,

      dto.sizeBytes,

      MAX_COMMUNITY_POST_CONTENT_IMAGE_BYTES,

    );



    const storageKey = this.storage.buildCommunityPostKey(communityId, 'content', dto.filename);

    const uploadUrl = await this.storage.presignUpload(storageKey, dto.contentType);

    const downloadUrl = await this.storage.presignDownload(storageKey);

    return {

      uploadUrl,

      storageKey,

      downloadUrl,

      expiresIn: this.storage.uploadExpirySeconds,

    };

  }



  private async toSummaryDtos(

    rows: Awaited<ReturnType<CommunityPostDao['findByCommunity']>>,

  ): Promise<CommunityPostSummaryDto[]> {

    const authorMeta = await this.resolveAuthorMeta(rows);

    const headerUrls = await Promise.all(

      rows.map((row) =>

        row.deletedAt || !row.headerStorageKey

          ? Promise.resolve(null)

          : this.storage.presignDownload(row.headerStorageKey),

      ),

    );

    return rows.map((row, index) => {

      const meta = authorMeta.get(row.authorUserId)!;

      return toCommunityPostSummaryDto(

        row,

        meta.avatarUrl,

        meta.displayName,

        headerUrls[index],

      );

    });

  }



  private async toDetailDtos(

    rows: Awaited<ReturnType<CommunityPostDao['findByIdInCommunity']>>[],

  ): Promise<CommunityPostDetailDto[]> {

    const filtered = rows.filter((row): row is NonNullable<typeof row> => row !== null);

    const authorMeta = await this.resolveAuthorMeta(filtered);

    return Promise.all(

      filtered.map(async (row) => {

        const meta = authorMeta.get(row.authorUserId)!;

        const isDeleted = row.deletedAt != null;

        const [content, headerUrl] = await Promise.all([

          isDeleted

            ? Promise.resolve('')

            : resolvePostContentImageUrls(this.storage, row.content),

          !isDeleted && row.headerStorageKey

            ? this.storage.presignDownload(row.headerStorageKey)

            : Promise.resolve(null),

        ]);

        return toCommunityPostDetailDto(row, meta.avatarUrl, meta.displayName, content, headerUrl);

      }),

    );

  }



  private async resolveAuthorMeta(

    rows: Array<{

      authorUserId: string;

      authorDisplayName: string;

      userImage: string | null;

      avatarStorageKey: string | null;

    }>,

  ): Promise<Map<string, { displayName: string; avatarUrl: string | null }>> {

    const uniqueAuthorIds = [...new Set(rows.map((row) => row.authorUserId))];

    const deletedUserIds = await this.privacyUserDao.findDeletedUserIds(uniqueAuthorIds);

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



    const meta = new Map<string, { displayName: string; avatarUrl: string | null }>();

    for (const authorId of uniqueAuthorIds) {

      const row = rows.find((item) => item.authorUserId === authorId)!;

      meta.set(authorId, {

        displayName: deletedUserIds.has(authorId)

          ? DELETED_USER_DISPLAY_NAME

          : row.authorDisplayName,

        avatarUrl: deletedUserIds.has(authorId)

          ? null

          : (avatarUrls.get(authorId) ?? null),

      });

    }

    return meta;

  }



  private normalizeHeaderStorageKey(value: string | null | undefined): string | null {

    if (value === null || value === undefined) {

      return null;

    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;

  }



  private assertPostImage(

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



  private async deleteStorageObject(key: string): Promise<void> {

    try {

      await this.storage.deleteObject(key);

    } catch {

      // Best-effort cleanup; orphaned objects can be garbage-collected later.

    }

  }



  private async canViewPost(

    post: Awaited<ReturnType<CommunityPostDao['findByIdInCommunity']>> & object,

    userId: string | null,

  ): Promise<boolean> {

    if (!post) {

      return false;

    }

    if (post.visibility === 'public') {

      return true;

    }

    if (!userId) {

      return false;

    }

    const membership = await this.memberDao.findMembership(post.communityId, userId);

    return membership !== null;

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



  private async requireAuthorOrOwner(

    communityId: string,

    userId: string,

    authorUserId: string,

  ) {

    if (authorUserId === userId) {

      return this.requireMembership(communityId, userId);

    }



    const membership = await this.requireMembership(communityId, userId);

    if (membership.role !== 'owner') {

      throw new ForbiddenException('Only the author or community owner can perform this action');

    }

    return membership;

  }

}

