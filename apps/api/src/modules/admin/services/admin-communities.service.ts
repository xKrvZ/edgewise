import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlatformAuditService } from '@/modules/platform-metrics/services/platform-audit.service';
import type { AdminCommunityRecord, AdminCommunityPostRecord } from '../daos/admin-community.dao';
import { AdminCommunityDao } from '../daos/admin-community.dao';
import type {
  AdminCommunitiesQueryDto,
  AdminCommunityPostsQueryDto,
} from '../dtos/admin-community.dto';
import {
  AdminCommunitiesPageDto,
  AdminCommunityDetailDto,
  AdminCommunityPostRowDto,
  AdminCommunityPostsPageDto,
  AdminCommunityRowDto,
} from '../dtos/admin-community.dto';

@Injectable()
export class AdminCommunitiesService {
  constructor(
    private readonly adminCommunityDao: AdminCommunityDao,
    private readonly platformAuditService: PlatformAuditService,
  ) {}

  async listCommunities(query: AdminCommunitiesQueryDto): Promise<AdminCommunitiesPageDto> {
    const limit = query.limit ?? 25;
    const offset = query.offset ?? 0;
    const { items, total } = await this.adminCommunityDao.listCommunities({
      limit,
      offset,
      search: query.search,
      discoverHidden: query.discoverHidden,
      featured: query.featured,
    });

    return {
      items: items.map((row) => this.toCommunityRow(row)),
      total,
      limit,
      offset,
    };
  }

  async getCommunity(communityId: string): Promise<AdminCommunityDetailDto> {
    const community = await this.requireCommunity(communityId);
    return this.toCommunityRow(community);
  }

  async listPosts(
    communityId: string,
    query: AdminCommunityPostsQueryDto,
  ): Promise<AdminCommunityPostsPageDto> {
    await this.requireCommunity(communityId);

    const limit = query.limit ?? 25;
    const offset = query.offset ?? 0;
    const { items, total } = await this.adminCommunityDao.listPosts({
      communityId,
      limit,
      offset,
      includeDeleted: query.includeDeleted ?? true,
    });

    return {
      items: items.map((row) => this.toPostRow(row)),
      total,
      limit,
      offset,
    };
  }

  async hideCommunityFromDiscover(
    communityId: string,
    actorUserId: string,
  ): Promise<AdminCommunityDetailDto> {
    const community = await this.requireCommunity(communityId);
    if (community.discoverHiddenAt) {
      throw new BadRequestException('Community is already hidden from discover');
    }

    const updated = await this.adminCommunityDao.setCommunityDiscoverHidden(
      communityId,
      new Date(),
    );
    if (!updated) {
      throw new NotFoundException('Community not found');
    }

    await this.platformAuditService.recordAdminCommunityDiscoverHidden({
      actorUserId,
      userId: community.createdBy,
      communityId,
      communityName: community.name,
    });

    return this.getCommunity(communityId);
  }

  async showCommunityOnDiscover(
    communityId: string,
    actorUserId: string,
  ): Promise<AdminCommunityDetailDto> {
    const community = await this.requireCommunity(communityId);
    if (!community.discoverHiddenAt) {
      throw new BadRequestException('Community is not hidden from discover');
    }

    const updated = await this.adminCommunityDao.setCommunityDiscoverHidden(communityId, null);
    if (!updated) {
      throw new NotFoundException('Community not found');
    }

    await this.platformAuditService.recordAdminCommunityDiscoverShown({
      actorUserId,
      userId: community.createdBy,
      communityId,
      communityName: community.name,
    });

    return this.getCommunity(communityId);
  }

  async featureCommunity(
    communityId: string,
    actorUserId: string,
  ): Promise<AdminCommunityDetailDto> {
    const community = await this.requireCommunity(communityId);
    if (community.featured) {
      throw new BadRequestException('Community is already featured');
    }

    const updated = await this.adminCommunityDao.setCommunityFeatured(communityId, true);
    if (!updated) {
      throw new NotFoundException('Community not found');
    }

    await this.platformAuditService.recordAdminCommunityFeatured({
      actorUserId,
      userId: community.createdBy,
      communityId,
      communityName: community.name,
    });

    return this.getCommunity(communityId);
  }

  async unfeatureCommunity(
    communityId: string,
    actorUserId: string,
  ): Promise<AdminCommunityDetailDto> {
    const community = await this.requireCommunity(communityId);
    if (!community.featured) {
      throw new BadRequestException('Community is not featured');
    }

    const updated = await this.adminCommunityDao.setCommunityFeatured(communityId, false);
    if (!updated) {
      throw new NotFoundException('Community not found');
    }

    await this.platformAuditService.recordAdminCommunityUnfeatured({
      actorUserId,
      userId: community.createdBy,
      communityId,
      communityName: community.name,
    });

    return this.getCommunity(communityId);
  }

  async softDeletePost(
    communityId: string,
    postId: string,
    actorUserId: string,
  ): Promise<AdminCommunityPostRowDto> {
    const community = await this.requireCommunity(communityId);
    const post = await this.requirePost(communityId, postId);

    if (post.deletedAt) {
      throw new BadRequestException('Post is already deleted');
    }

    const updated = await this.adminCommunityDao.softDeletePost(communityId, postId);
    if (!updated) {
      throw new NotFoundException('Post not found');
    }

    await this.platformAuditService.recordAdminCommunityPostDeleted({
      actorUserId,
      userId: post.authorUserId,
      communityId,
      communityName: community.name,
      postId,
      postTitle: post.title,
    });

    return this.getPostRow(communityId, postId);
  }

  async restorePost(
    communityId: string,
    postId: string,
    actorUserId: string,
  ): Promise<AdminCommunityPostRowDto> {
    const community = await this.requireCommunity(communityId);
    const post = await this.requirePost(communityId, postId);

    if (!post.deletedAt) {
      throw new BadRequestException('Post is not deleted');
    }

    const updated = await this.adminCommunityDao.restorePost(communityId, postId);
    if (!updated) {
      throw new NotFoundException('Post not found');
    }

    await this.platformAuditService.recordAdminCommunityPostRestored({
      actorUserId,
      userId: post.authorUserId,
      communityId,
      communityName: community.name,
      postId,
      postTitle: post.title,
    });

    return this.getPostRow(communityId, postId);
  }

  async hidePostFromDiscover(
    communityId: string,
    postId: string,
    actorUserId: string,
  ): Promise<AdminCommunityPostRowDto> {
    const community = await this.requireCommunity(communityId);
    const post = await this.requirePost(communityId, postId);

    if (post.discoverHiddenAt) {
      throw new BadRequestException('Post is already hidden from discover');
    }

    const updated = await this.adminCommunityDao.setPostDiscoverHidden(
      communityId,
      postId,
      new Date(),
    );
    if (!updated) {
      throw new NotFoundException('Post not found');
    }

    await this.platformAuditService.recordAdminCommunityPostDiscoverHidden({
      actorUserId,
      userId: post.authorUserId,
      communityId,
      communityName: community.name,
      postId,
      postTitle: post.title,
    });

    return this.getPostRow(communityId, postId);
  }

  async showPostOnDiscover(
    communityId: string,
    postId: string,
    actorUserId: string,
  ): Promise<AdminCommunityPostRowDto> {
    const community = await this.requireCommunity(communityId);
    const post = await this.requirePost(communityId, postId);

    if (!post.discoverHiddenAt) {
      throw new BadRequestException('Post is not hidden from discover');
    }

    const updated = await this.adminCommunityDao.setPostDiscoverHidden(
      communityId,
      postId,
      null,
    );
    if (!updated) {
      throw new NotFoundException('Post not found');
    }

    await this.platformAuditService.recordAdminCommunityPostDiscoverShown({
      actorUserId,
      userId: post.authorUserId,
      communityId,
      communityName: community.name,
      postId,
      postTitle: post.title,
    });

    return this.getPostRow(communityId, postId);
  }

  private async requireCommunity(communityId: string): Promise<AdminCommunityRecord> {
    const community = await this.adminCommunityDao.findCommunityById(communityId);
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return community;
  }

  private async requirePost(
    communityId: string,
    postId: string,
  ): Promise<AdminCommunityPostRecord> {
    const post = await this.adminCommunityDao.findPostById(communityId, postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  private async getPostRow(
    communityId: string,
    postId: string,
  ): Promise<AdminCommunityPostRowDto> {
    const post = await this.requirePost(communityId, postId);
    return this.toPostRow(post);
  }

  private toCommunityRow(row: AdminCommunityRecord): AdminCommunityRowDto {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      joinPolicy: row.joinPolicy,
      createdBy: row.createdBy,
      creatorEmail: row.creatorEmail,
      creatorName: row.creatorName,
      creatorDisplayName: row.creatorDisplayName,
      memberCount: row.memberCount,
      postCount: row.postCount,
      discoverHiddenAt: row.discoverHiddenAt?.toISOString() ?? null,
      featured: row.featured,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toPostRow(row: AdminCommunityPostRecord): AdminCommunityPostRowDto {
    return {
      id: row.id,
      communityId: row.communityId,
      title: row.title,
      visibility: row.visibility,
      authorUserId: row.authorUserId,
      authorEmail: row.authorEmail,
      authorName: row.authorName,
      authorDisplayName: row.authorDisplayName,
      publishedAt: row.publishedAt.toISOString(),
      deletedAt: row.deletedAt?.toISOString() ?? null,
      discoverHiddenAt: row.discoverHiddenAt?.toISOString() ?? null,
    };
  }
}
