import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { resolveUserDisplayLabel } from '@/common/utils/resolve-user-display.util';
import { KyselyDao } from '@/database/kysely/kysely.dao';

export interface AdminCommunityRecord {
  id: string;
  name: string;
  description: string | null;
  joinPolicy: string;
  createdBy: string;
  creatorEmail: string;
  creatorName: string | null;
  creatorDisplayName: string | null;
  memberCount: number;
  postCount: number;
  discoverHiddenAt: Date | null;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCommunityPostRecord {
  id: string;
  communityId: string;
  title: string;
  visibility: string;
  authorUserId: string;
  authorEmail: string;
  authorName: string | null;
  authorDisplayName: string | null;
  publishedAt: Date;
  deletedAt: Date | null;
  discoverHiddenAt: Date | null;
}

@Injectable()
export class AdminCommunityDao extends KyselyDao<AdminCommunityDao> {
  async listCommunities(params: {
    limit: number;
    offset: number;
    search?: string;
    discoverHidden?: boolean;
    featured?: boolean;
  }): Promise<{ items: AdminCommunityRecord[]; total: number }> {
    let filtered = this.kysely.selectFrom('community');

    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      filtered = filtered.where((eb) =>
        eb.or([eb('community.name', 'ilike', term), eb('community.description', 'ilike', term)]),
      );
    }

    if (params.discoverHidden === true) {
      filtered = filtered.where('community.discoverHiddenAt', 'is not', null);
    } else if (params.discoverHidden === false) {
      filtered = filtered.where('community.discoverHiddenAt', 'is', null);
    }

    if (params.featured === true) {
      filtered = filtered.where('community.featured', '=', true);
    } else if (params.featured === false) {
      filtered = filtered.where('community.featured', '=', false);
    }

    const [totalRow, rows] = await Promise.all([
      filtered.select((eb) => eb.fn.countAll<number>().as('count')).executeTakeFirst(),
      filtered
        .innerJoin('user', 'user.id', 'community.createdBy')
        .leftJoin('trader_profile', 'trader_profile.userId', 'community.createdBy')
        .select([
          'community.id',
          'community.name',
          'community.description',
          'community.joinPolicy',
          'community.createdBy',
          'community.discoverHiddenAt',
          'community.featured',
          'community.createdAt',
          'community.updatedAt',
          'user.email as creatorEmail',
          'user.name as creatorName',
          'trader_profile.displayName as creatorDisplayName',
        ])
        .select((eb) =>
          eb
            .selectFrom('community_member as cm')
            .select((eb2) => eb2.fn.count<number>('cm.id').as('count'))
            .whereRef('cm.communityId', '=', 'community.id')
            .as('memberCount'),
        )
        .select((eb) =>
          eb
            .selectFrom('community_post as cp')
            .select((eb2) => eb2.fn.count<number>('cp.id').as('count'))
            .whereRef('cp.communityId', '=', 'community.id')
            .as('postCount'),
        )
        .orderBy('community.updatedAt', 'desc')
        .limit(params.limit)
        .offset(params.offset)
        .execute(),
    ]);

    return {
      total: Number(totalRow?.count ?? 0),
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        joinPolicy: row.joinPolicy,
        createdBy: row.createdBy,
        creatorEmail: row.creatorEmail,
        creatorName: row.creatorName,
        creatorDisplayName: row.creatorDisplayName,
        memberCount: Number(row.memberCount ?? 0),
        postCount: Number(row.postCount ?? 0),
        discoverHiddenAt: row.discoverHiddenAt ? new Date(row.discoverHiddenAt) : null,
        featured: Boolean(row.featured),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
    };
  }

  async findCommunityById(id: string): Promise<AdminCommunityRecord | null> {
    const row = await this.kysely
      .selectFrom('community')
      .innerJoin('user', 'user.id', 'community.createdBy')
      .leftJoin('trader_profile', 'trader_profile.userId', 'community.createdBy')
      .select([
        'community.id',
        'community.name',
        'community.description',
        'community.joinPolicy',
        'community.createdBy',
        'community.discoverHiddenAt',
        'community.featured',
        'community.createdAt',
        'community.updatedAt',
        'user.email as creatorEmail',
        'user.name as creatorName',
        'trader_profile.displayName as creatorDisplayName',
      ])
      .select((eb) =>
        eb
          .selectFrom('community_member as cm')
          .select((eb2) => eb2.fn.count<number>('cm.id').as('count'))
          .whereRef('cm.communityId', '=', 'community.id')
          .as('memberCount'),
      )
      .select((eb) =>
        eb
          .selectFrom('community_post as cp')
          .select((eb2) => eb2.fn.count<number>('cp.id').as('count'))
          .whereRef('cp.communityId', '=', 'community.id')
          .as('postCount'),
      )
      .where('community.id', '=', id)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      joinPolicy: row.joinPolicy,
      createdBy: row.createdBy,
      creatorEmail: row.creatorEmail,
      creatorName: row.creatorName,
      creatorDisplayName: row.creatorDisplayName,
      memberCount: Number(row.memberCount ?? 0),
      postCount: Number(row.postCount ?? 0),
      discoverHiddenAt: row.discoverHiddenAt ? new Date(row.discoverHiddenAt) : null,
      featured: Boolean(row.featured),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async listPosts(params: {
    communityId: string;
    limit: number;
    offset: number;
    includeDeleted?: boolean;
  }): Promise<{ items: AdminCommunityPostRecord[]; total: number }> {
    let filtered = this.kysely
      .selectFrom('community_post')
      .where('community_post.communityId', '=', params.communityId);

    if (!params.includeDeleted) {
      filtered = filtered.where('community_post.deletedAt', 'is', null);
    }

    const [totalRow, rows] = await Promise.all([
      filtered.select((eb) => eb.fn.countAll<number>().as('count')).executeTakeFirst(),
      filtered
        .innerJoin('user', 'user.id', 'community_post.authorUserId')
        .leftJoin('trader_profile', 'trader_profile.userId', 'community_post.authorUserId')
        .select([
          'community_post.id',
          'community_post.communityId',
          'community_post.title',
          'community_post.visibility',
          'community_post.authorUserId',
          'community_post.publishedAt',
          'community_post.deletedAt',
          'community_post.discoverHiddenAt',
          'user.email as authorEmail',
          'user.name as authorName',
          'trader_profile.displayName as authorDisplayName',
        ])
        .orderBy('community_post.publishedAt', 'desc')
        .limit(params.limit)
        .offset(params.offset)
        .execute(),
    ]);

    return {
      total: Number(totalRow?.count ?? 0),
      items: rows.map((row) => ({
        id: row.id,
        communityId: row.communityId,
        title: row.title,
        visibility: row.visibility,
        authorUserId: row.authorUserId,
        authorEmail: row.authorEmail,
        authorName: row.authorName,
        authorDisplayName: resolveUserDisplayLabel({
          displayName: row.authorDisplayName,
          name: row.authorName,
          email: row.authorEmail,
        }),
        publishedAt: new Date(row.publishedAt),
        deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
        discoverHiddenAt: row.discoverHiddenAt ? new Date(row.discoverHiddenAt) : null,
      })),
    };
  }

  async findPostById(
    communityId: string,
    postId: string,
  ): Promise<AdminCommunityPostRecord | null> {
    const row = await this.kysely
      .selectFrom('community_post')
      .innerJoin('user', 'user.id', 'community_post.authorUserId')
      .leftJoin('trader_profile', 'trader_profile.userId', 'community_post.authorUserId')
      .select([
        'community_post.id',
        'community_post.communityId',
        'community_post.title',
        'community_post.visibility',
        'community_post.authorUserId',
        'community_post.publishedAt',
        'community_post.deletedAt',
        'community_post.discoverHiddenAt',
        'user.email as authorEmail',
        'user.name as authorName',
        'trader_profile.displayName as authorDisplayName',
      ])
      .where('community_post.id', '=', postId)
      .where('community_post.communityId', '=', communityId)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      communityId: row.communityId,
      title: row.title,
      visibility: row.visibility,
      authorUserId: row.authorUserId,
      authorEmail: row.authorEmail,
      authorName: row.authorName,
      authorDisplayName: resolveUserDisplayLabel({
        displayName: row.authorDisplayName,
        name: row.authorName,
        email: row.authorEmail,
      }),
      publishedAt: new Date(row.publishedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
      discoverHiddenAt: row.discoverHiddenAt ? new Date(row.discoverHiddenAt) : null,
    };
  }

  async setCommunityDiscoverHidden(
    id: string,
    hiddenAt: Date | null,
  ): Promise<{ id: string; discoverHiddenAt: Date | null } | null> {
    const row = await this.kysely
      .updateTable('community')
      .set({ discoverHiddenAt: hiddenAt, updatedAt: sql`now()` })
      .where('id', '=', id)
      .returning(['id', 'discoverHiddenAt'])
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      discoverHiddenAt: row.discoverHiddenAt ? new Date(row.discoverHiddenAt) : null,
    };
  }

  async setCommunityFeatured(
    id: string,
    featured: boolean,
  ): Promise<{ id: string; featured: boolean } | null> {
    const row = await this.kysely
      .updateTable('community')
      .set({ featured, updatedAt: sql`now()` })
      .where('id', '=', id)
      .returning(['id', 'featured'])
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      featured: Boolean(row.featured),
    };
  }

  async softDeletePost(communityId: string, postId: string): Promise<boolean> {
    const result = await this.kysely
      .updateTable('community_post')
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where('id', '=', postId)
      .where('communityId', '=', communityId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0) > 0;
  }

  async restorePost(communityId: string, postId: string): Promise<boolean> {
    const result = await this.kysely
      .updateTable('community_post')
      .set({ deletedAt: null, updatedAt: new Date() })
      .where('id', '=', postId)
      .where('communityId', '=', communityId)
      .where('deletedAt', 'is not', null)
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0) > 0;
  }

  async setPostDiscoverHidden(
    communityId: string,
    postId: string,
    hiddenAt: Date | null,
  ): Promise<boolean> {
    const result = await this.kysely
      .updateTable('community_post')
      .set({ discoverHiddenAt: hiddenAt, updatedAt: new Date() })
      .where('id', '=', postId)
      .where('communityId', '=', communityId)
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0) > 0;
  }
}
