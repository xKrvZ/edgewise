import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { ROLES } from '@/auth/constants/roles.constants';
import billingConfig, { type BillingPlanId } from '@/config/billing.config';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { AdminUserPlanFilter, AdminUserSubscriptionActiveFilter } from '../dtos/admin-user.dto';

const ALL_KNOWN_PRODUCT_IDS = Object.keys(billingConfig.productIdToPlan);

function productIdsForPlan(plan: BillingPlanId): string[] {
  return Object.entries(billingConfig.productIdToPlan)
    .filter(([, planId]) => planId === plan)
    .map(([productId]) => productId);
}

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  displayName: string | null;
  role: string | null;
  createdAt: Date;
  emailVerified: boolean;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  image: string | null;
  avatarStorageKey: string | null;
  deletedAt: Date | null;
  anonymizedAt: Date | null;
  subscriptionStatus: string | null;
  polarCustomerId: string | null;
  polarSubscriptionId: string | null;
  productId: string | null;
  currentPeriodEnd: Date | null;
  adminPlanOverride: boolean | null;
}

export interface DailyCountRow {
  date: string;
  count: number;
}

export interface DailyAmountRow {
  date: string;
  amount: number;
}

@Injectable()
export class AdminDao extends KyselyDao<AdminDao> {
  async countUsers(): Promise<number> {
    const row = await this.kysely
      .selectFrom('user')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async countTrades(): Promise<number> {
    const row = await this.kysely
      .selectFrom('trade')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async countTradesSince(since: Date): Promise<number> {
    const row = await this.kysely
      .selectFrom('trade')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('createdAt', '>=', since)
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async countTradesBetween(start: Date, end: Date): Promise<number> {
    const row = await this.kysely
      .selectFrom('trade')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('createdAt', '>=', start)
      .where('createdAt', '<', end)
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async countTradingAccounts(): Promise<number> {
    const row = await this.kysely
      .selectFrom('trading_account')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async countCommunities(): Promise<number> {
    const row = await this.kysely
      .selectFrom('community')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async countTradingAccountsSince(since: Date): Promise<number> {
    const row = await this.kysely
      .selectFrom('trading_account')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('createdAt', '>=', since)
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async countTradingAccountsBetween(start: Date, end: Date): Promise<number> {
    const row = await this.kysely
      .selectFrom('trading_account')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('createdAt', '>=', start)
      .where('createdAt', '<', end)
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async countCommunitiesSince(since: Date): Promise<number> {
    const row = await this.kysely
      .selectFrom('community')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('createdAt', '>=', since)
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async countCommunityPosts(): Promise<number> {
    const row = await this.kysely
      .selectFrom('community_post')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async countCommunityPostsSince(since: Date): Promise<number> {
    const row = await this.kysely
      .selectFrom('community_post')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('createdAt', '>=', since)
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async countUsersSince(since: Date): Promise<number> {
    const row = await this.kysely
      .selectFrom('user')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('createdAt', '>=', since)
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async countUsersBetween(start: Date, end: Date): Promise<number> {
    const row = await this.kysely
      .selectFrom('user')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('createdAt', '>=', start)
      .where('createdAt', '<', end)
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async getUserSignupSeries(since: Date): Promise<DailyCountRow[]> {
    const rows = await this.kysely
      .selectFrom('user')
      .select([
        sql<string>`to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD')`.as('date'),
        sql<number>`count(*)::int`.as('count'),
      ])
      .where('createdAt', '>=', since)
      .groupBy(sql`date_trunc('day', "createdAt")`)
      .orderBy(sql`date_trunc('day', "createdAt")`, 'asc')
      .execute();

    return rows.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));
  }

  async countSubscriptionsByStatus(status: string): Promise<number> {
    const row = await this.kysely
      .selectFrom('user_subscription')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('status', '=', status)
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async countSubscriptionsSince(status: string, since: Date): Promise<number> {
    const row = await this.kysely
      .selectFrom('user_subscription')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('status', '=', status)
      .where('createdAt', '>=', since)
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async countSubscriptionsBetween(
    status: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const row = await this.kysely
      .selectFrom('user_subscription')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('status', '=', status)
      .where('createdAt', '>=', start)
      .where('createdAt', '<', end)
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async getActiveSubscriptionSeries(since: Date): Promise<DailyCountRow[]> {
    const rows = await this.kysely
      .selectFrom('user_subscription')
      .select([
        sql<string>`to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD')`.as('date'),
        sql<number>`count(*)::int`.as('count'),
      ])
      .where('status', '=', 'active')
      .where('createdAt', '>=', since)
      .groupBy(sql`date_trunc('day', "createdAt")`)
      .orderBy(sql`date_trunc('day', "createdAt")`, 'asc')
      .execute();

    return rows.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));
  }

  async getCanceledSubscriptionSeries(since: Date): Promise<DailyCountRow[]> {
    const rows = await this.kysely
      .selectFrom('user_subscription')
      .select([
        sql<string>`to_char(date_trunc('day', "updatedAt"), 'YYYY-MM-DD')`.as('date'),
        sql<number>`count(*)::int`.as('count'),
      ])
      .where('status', '=', 'canceled')
      .where('updatedAt', '>=', since)
      .groupBy(sql`date_trunc('day', "updatedAt")`)
      .orderBy(sql`date_trunc('day', "updatedAt")`, 'asc')
      .execute();

    return rows.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));
  }

  async getTradeSeries(since: Date): Promise<DailyCountRow[]> {
    const rows = await this.kysely
      .selectFrom('trade')
      .select([
        sql<string>`to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD')`.as('date'),
        sql<number>`count(*)::int`.as('count'),
      ])
      .where('createdAt', '>=', since)
      .groupBy(sql`date_trunc('day', "createdAt")`)
      .orderBy(sql`date_trunc('day', "createdAt")`, 'asc')
      .execute();

    return rows.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));
  }

  async getTradingAccountSeries(since: Date): Promise<DailyCountRow[]> {
    const rows = await this.kysely
      .selectFrom('trading_account')
      .select([
        sql<string>`to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD')`.as('date'),
        sql<number>`count(*)::int`.as('count'),
      ])
      .where('createdAt', '>=', since)
      .groupBy(sql`date_trunc('day', "createdAt")`)
      .orderBy(sql`date_trunc('day', "createdAt")`, 'asc')
      .execute();

    return rows.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));
  }

  async getCommunityJoinSeries(since: Date): Promise<DailyCountRow[]> {
    const rows = await this.kysely
      .selectFrom('community_member')
      .select([
        sql<string>`to_char(date_trunc('day', "joinedAt"), 'YYYY-MM-DD')`.as('date'),
        sql<number>`count(*)::int`.as('count'),
      ])
      .where('joinedAt', '>=', since)
      .groupBy(sql`date_trunc('day', "joinedAt")`)
      .orderBy(sql`date_trunc('day', "joinedAt")`, 'asc')
      .execute();

    return rows.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));
  }

  async listUsers(params: {
    limit: number;
    offset: number;
    search?: string;
    subscriptionActive?: AdminUserSubscriptionActiveFilter;
    plan?: AdminUserPlanFilter;
    role?: string;
  }): Promise<{ items: AdminUserRecord[]; total: number }> {
    let filtered = this.kysely
      .selectFrom('user')
      .leftJoin('user_subscription', 'user_subscription.userId', 'user.id');

    if (params.search?.trim()) {
      filtered = filtered.where('email', 'ilike', `%${params.search.trim()}%`);
    }

    if (params.subscriptionActive === 'active') {
      filtered = filtered.where('user_subscription.status', '=', 'active');
    } else if (params.subscriptionActive === 'inactive') {
      filtered = filtered.where((eb) =>
        eb.or([
          eb('user_subscription.status', 'is', null),
          eb('user_subscription.status', '!=', 'active'),
        ]),
      );
    }

    if (params.role) {
      if (params.role === ROLES.USER) {
        filtered = filtered.where((eb) =>
          eb.or([
            eb('user.role', 'is', null),
            eb('user.role', '=', ''),
            eb(sql<string>`lower(trim("user"."role"))`, '=', 'user'),
          ]),
        );
      } else {
        filtered = filtered.where('user.role', '=', params.role);
      }
    }

    if (params.plan) {
      if (params.plan === 'none') {
        filtered = filtered.where((eb) => {
          const activeWithKnownProduct =
            ALL_KNOWN_PRODUCT_IDS.length > 0
              ? eb.and([
                  eb('user_subscription.status', '=', 'active'),
                  eb('user_subscription.productId', 'in', ALL_KNOWN_PRODUCT_IDS),
                ])
              : eb(sql`false`, '=', true);

          const mockDefaultPlanMatch =
            billingConfig.provider === 'mock'
              ? eb.or([
                  eb.and([
                    eb('user_subscription.status', '=', 'active'),
                    eb('user_subscription.productId', 'is', null),
                  ]),
                  eb('user_subscription.userId', 'is', null),
                ])
              : eb(sql`false`, '=', true);

          const demoPlanMatch = eb('user.email', '=', billingConfig.demoUserEmail);

          return eb.not(eb.or([activeWithKnownProduct, mockDefaultPlanMatch, demoPlanMatch]));
        });
      } else {
        const billingPlan = params.plan as BillingPlanId;
        const productIds = productIdsForPlan(billingPlan);

        filtered = filtered.where((eb) => {
          const matches = [
            ...(productIds.length > 0
              ? [
                  eb.and([
                    eb('user_subscription.status', '=', 'active'),
                    eb('user_subscription.productId', 'in', productIds),
                  ]),
                ]
              : []),
            ...(billingConfig.provider === 'mock' &&
            billingConfig.mockDefaultPlan === billingPlan
              ? [
                  eb.and([
                    eb.or([
                      eb('user_subscription.status', '=', 'active'),
                      eb('user_subscription.userId', 'is', null),
                    ]),
                    eb.or([
                      eb('user_subscription.productId', 'is', null),
                      eb('user_subscription.userId', 'is', null),
                    ]),
                  ]),
                ]
              : []),
            ...(billingConfig.demoPlan === billingPlan
              ? [eb('user.email', '=', billingConfig.demoUserEmail)]
              : []),
          ];

          return matches.length > 0 ? eb.or(matches) : eb(sql`false`, '=', true);
        });
      }
    }

    const [totalRow, rows] = await Promise.all([
      filtered.select((eb) => eb.fn.countAll<number>().as('count')).executeTakeFirst(),
      filtered
        .leftJoin('trader_profile', 'trader_profile.userId', 'user.id')
        .select([
          'user.id',
          'user.email',
          'user.name',
          'trader_profile.displayName as displayName',
          'user.role',
          'user.createdAt',
          'user.emailVerified',
          'user.banned',
          'user.banReason',
          'user.banExpires',
          'user.image',
          'trader_profile.avatarStorageKey as avatarStorageKey',
          'user.deletedAt',
          'user.anonymizedAt',
          'user_subscription.status as subscriptionStatus',
          'user_subscription.polarCustomerId as polarCustomerId',
          'user_subscription.polarSubscriptionId as polarSubscriptionId',
          'user_subscription.productId as productId',
          'user_subscription.currentPeriodEnd as currentPeriodEnd',
          'user_subscription.adminPlanOverride as adminPlanOverride',
        ])
        .orderBy('user.createdAt', 'desc')
        .limit(params.limit)
        .offset(params.offset)
        .execute(),
    ]);

    return {
      total: Number(totalRow?.count ?? 0),
      items: rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        displayName: row.displayName,
        role: row.role,
        createdAt: new Date(row.createdAt),
        emailVerified: row.emailVerified,
        banned: row.banned,
        banReason: row.banReason,
        banExpires: row.banExpires ? new Date(row.banExpires) : null,
        image: row.image,
        avatarStorageKey: row.avatarStorageKey,
        deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
        anonymizedAt: row.anonymizedAt ? new Date(row.anonymizedAt) : null,
        subscriptionStatus: row.subscriptionStatus,
        polarCustomerId: row.polarCustomerId,
        polarSubscriptionId: row.polarSubscriptionId,
        productId: row.productId,
        currentPeriodEnd: row.currentPeriodEnd ? new Date(row.currentPeriodEnd) : null,
        adminPlanOverride: row.adminPlanOverride ?? false,
      })),
    };
  }

  async listSubscribers(params: {
    limit: number;
    offset: number;
    search?: string;
    status?: string;
  }): Promise<{ items: AdminUserRecord[]; total: number }> {
    let filtered = this.kysely
      .selectFrom('user')
      .innerJoin('user_subscription', 'user_subscription.userId', 'user.id');

    if (params.status?.trim()) {
      filtered = filtered.where('user_subscription.status', '=', params.status.trim());
    }

    if (params.search?.trim()) {
      filtered = filtered.where('user.email', 'ilike', `%${params.search.trim()}%`);
    }

    const [totalRow, rows] = await Promise.all([
      filtered.select((eb) => eb.fn.countAll<number>().as('count')).executeTakeFirst(),
      filtered
        .leftJoin('trader_profile', 'trader_profile.userId', 'user.id')
        .select([
          'user.id',
          'user.email',
          'user.name',
          'trader_profile.displayName as displayName',
          'user.role',
          'user.createdAt',
          'user.emailVerified',
          'user.banned',
          'user.banReason',
          'user.banExpires',
          'user.image',
          'trader_profile.avatarStorageKey as avatarStorageKey',
          'user.deletedAt',
          'user.anonymizedAt',
          'user_subscription.status as subscriptionStatus',
          'user_subscription.polarCustomerId as polarCustomerId',
          'user_subscription.polarSubscriptionId as polarSubscriptionId',
          'user_subscription.productId as productId',
          'user_subscription.currentPeriodEnd as currentPeriodEnd',
          'user_subscription.adminPlanOverride as adminPlanOverride',
        ])
        .orderBy('user_subscription.updatedAt', 'desc')
        .limit(params.limit)
        .offset(params.offset)
        .execute(),
    ]);

    return {
      total: Number(totalRow?.count ?? 0),
      items: rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        displayName: row.displayName,
        role: row.role,
        createdAt: new Date(row.createdAt),
        emailVerified: row.emailVerified,
        banned: row.banned,
        banReason: row.banReason,
        banExpires: row.banExpires ? new Date(row.banExpires) : null,
        image: row.image,
        avatarStorageKey: row.avatarStorageKey,
        deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
        anonymizedAt: row.anonymizedAt ? new Date(row.anonymizedAt) : null,
        subscriptionStatus: row.subscriptionStatus,
        polarCustomerId: row.polarCustomerId,
        polarSubscriptionId: row.polarSubscriptionId,
        productId: row.productId,
        currentPeriodEnd: row.currentPeriodEnd ? new Date(row.currentPeriodEnd) : null,
        adminPlanOverride: row.adminPlanOverride ?? false,
      })),
    };
  }

  async findUserById(userId: string): Promise<AdminUserRecord | null> {
    const row = await this.kysely
      .selectFrom('user')
      .leftJoin('user_subscription', 'user_subscription.userId', 'user.id')
      .leftJoin('trader_profile', 'trader_profile.userId', 'user.id')
      .select([
        'user.id',
        'user.email',
        'user.name',
        'trader_profile.displayName as displayName',
        'user.role',
        'user.createdAt',
        'user.emailVerified',
        'user.banned',
        'user.banReason',
        'user.banExpires',
        'user.image',
        'trader_profile.avatarStorageKey as avatarStorageKey',
        'user.deletedAt',
        'user.anonymizedAt',
        'user_subscription.status as subscriptionStatus',
        'user_subscription.polarCustomerId as polarCustomerId',
        'user_subscription.polarSubscriptionId as polarSubscriptionId',
        'user_subscription.productId as productId',
        'user_subscription.currentPeriodEnd as currentPeriodEnd',
        'user_subscription.adminPlanOverride as adminPlanOverride',
      ])
      .where('user.id', '=', userId)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      displayName: row.displayName,
      role: row.role,
      createdAt: new Date(row.createdAt),
      emailVerified: row.emailVerified,
      banned: row.banned,
      banReason: row.banReason,
      banExpires: row.banExpires ? new Date(row.banExpires) : null,
      image: row.image,
      avatarStorageKey: row.avatarStorageKey,
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
      anonymizedAt: row.anonymizedAt ? new Date(row.anonymizedAt) : null,
      subscriptionStatus: row.subscriptionStatus,
      polarCustomerId: row.polarCustomerId,
      polarSubscriptionId: row.polarSubscriptionId,
      productId: row.productId,
      currentPeriodEnd: row.currentPeriodEnd ? new Date(row.currentPeriodEnd) : null,
      adminPlanOverride: row.adminPlanOverride ?? false,
    };
  }
}
