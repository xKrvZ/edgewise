import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';

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

  async listUsers(params: {
    limit: number;
    offset: number;
    search?: string;
  }): Promise<{ items: AdminUserRecord[]; total: number }> {
    let filtered = this.kysely.selectFrom('user');

    if (params.search?.trim()) {
      filtered = filtered.where('email', 'ilike', `%${params.search.trim()}%`);
    }

    const [totalRow, rows] = await Promise.all([
      filtered.select((eb) => eb.fn.countAll<number>().as('count')).executeTakeFirst(),
      filtered
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
    };
  }
}
