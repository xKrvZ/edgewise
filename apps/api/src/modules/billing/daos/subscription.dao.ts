import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';

export interface UserSubscriptionRecord {
  userId: string;
  status: string;
  polarCustomerId: string | null;
  polarSubscriptionId: string | null;
  productId: string | null;
  currentPeriodEnd: Date | null;
  adminPlanOverride: boolean;
}

@Injectable()
export class SubscriptionDao extends KyselyDao<SubscriptionDao> {
  async findByUserId(userId: string): Promise<UserSubscriptionRecord | null> {
    const row = await this.kysely
      .selectFrom('user_subscription')
      .select([
        'userId',
        'status',
        'polarCustomerId',
        'polarSubscriptionId',
        'productId',
        'currentPeriodEnd',
        'adminPlanOverride',
      ])
      .where('userId', '=', userId)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return {
      userId: row.userId,
      status: row.status,
      polarCustomerId: row.polarCustomerId,
      polarSubscriptionId: row.polarSubscriptionId,
      productId: row.productId,
      currentPeriodEnd: row.currentPeriodEnd ? new Date(row.currentPeriodEnd) : null,
      adminPlanOverride: row.adminPlanOverride,
    };
  }

  async findUserIdByPolarCustomerId(polarCustomerId: string): Promise<string | null> {
    const row = await this.kysely
      .selectFrom('user_subscription')
      .select('userId')
      .where('polarCustomerId', '=', polarCustomerId)
      .executeTakeFirst();

    return row?.userId ?? null;
  }

  async upsertFromPolar(params: {
    userId: string;
    status: string;
    polarCustomerId: string | null;
    polarSubscriptionId: string | null;
    productId: string | null;
    currentPeriodEnd: Date | null;
    adminPlanOverride?: boolean;
  }): Promise<UserSubscriptionRecord> {
    const existing = await this.findByUserId(params.userId);
    const preserveLocalPlan = existing?.adminPlanOverride === true;

    if (existing) {
      await this.kysely
        .updateTable('user_subscription')
        .set({
          status: preserveLocalPlan ? existing.status : params.status,
          polarCustomerId: params.polarCustomerId ?? existing.polarCustomerId,
          polarSubscriptionId: params.polarSubscriptionId ?? existing.polarSubscriptionId,
          productId: preserveLocalPlan
            ? existing.productId
            : (params.productId ?? existing.productId),
          currentPeriodEnd: preserveLocalPlan
            ? existing.currentPeriodEnd
            : (params.currentPeriodEnd ?? existing.currentPeriodEnd),
          adminPlanOverride:
            params.adminPlanOverride !== undefined
              ? params.adminPlanOverride
              : existing.adminPlanOverride,
          updatedAt: new Date(),
        })
        .where('userId', '=', params.userId)
        .execute();

      return {
        userId: params.userId,
        status: preserveLocalPlan ? existing.status : params.status,
        polarCustomerId: params.polarCustomerId ?? existing.polarCustomerId,
        polarSubscriptionId: params.polarSubscriptionId ?? existing.polarSubscriptionId,
        productId: preserveLocalPlan
          ? existing.productId
          : (params.productId ?? existing.productId),
        currentPeriodEnd: preserveLocalPlan
          ? existing.currentPeriodEnd
          : (params.currentPeriodEnd ?? existing.currentPeriodEnd),
        adminPlanOverride:
          params.adminPlanOverride !== undefined
            ? params.adminPlanOverride
            : existing.adminPlanOverride,
      };
    }

    await this.kysely
      .insertInto('user_subscription')
      .values({
        userId: params.userId,
        status: params.status,
        polarCustomerId: params.polarCustomerId,
        polarSubscriptionId: params.polarSubscriptionId,
        productId: params.productId,
        currentPeriodEnd: params.currentPeriodEnd,
        adminPlanOverride: params.adminPlanOverride ?? false,
        updatedAt: new Date(),
      })
      .execute();

    return {
      userId: params.userId,
      status: params.status,
      polarCustomerId: params.polarCustomerId,
      polarSubscriptionId: params.polarSubscriptionId,
      productId: params.productId,
      currentPeriodEnd: params.currentPeriodEnd,
      adminPlanOverride: params.adminPlanOverride ?? false,
    };
  }

  async upsertAdminPlan(
    userId: string,
    params: {
      status: string;
      productId?: string | null;
      currentPeriodEnd?: Date | null;
      adminPlanOverride?: boolean;
    },
  ): Promise<UserSubscriptionRecord> {
    const existing = await this.findByUserId(userId);

    if (existing) {
      await this.kysely
        .updateTable('user_subscription')
        .set({
          status: params.status,
          productId: params.productId ?? existing.productId,
          currentPeriodEnd: params.currentPeriodEnd ?? existing.currentPeriodEnd,
          adminPlanOverride:
            params.adminPlanOverride !== undefined
              ? params.adminPlanOverride
              : existing.adminPlanOverride,
          updatedAt: new Date(),
        })
        .where('userId', '=', userId)
        .execute();

      return {
        ...existing,
        status: params.status,
        productId: params.productId ?? existing.productId,
        currentPeriodEnd: params.currentPeriodEnd ?? existing.currentPeriodEnd,
        adminPlanOverride:
          params.adminPlanOverride !== undefined
            ? params.adminPlanOverride
            : existing.adminPlanOverride,
      };
    }

    const periodEnd = params.currentPeriodEnd ?? null;
    await this.kysely
      .insertInto('user_subscription')
      .values({
        userId,
        status: params.status,
        productId: params.productId ?? null,
        currentPeriodEnd: periodEnd,
        adminPlanOverride: params.adminPlanOverride ?? false,
        updatedAt: new Date(),
      })
      .execute();

    return {
      userId,
      status: params.status,
      polarCustomerId: null,
      polarSubscriptionId: null,
      productId: params.productId ?? null,
      currentPeriodEnd: periodEnd,
      adminPlanOverride: params.adminPlanOverride ?? false,
    };
  }

  async upsertAdminStatus(userId: string, status: string): Promise<UserSubscriptionRecord> {
    const existing = await this.findByUserId(userId);

    if (existing) {
      await this.kysely
        .updateTable('user_subscription')
        .set({
          status,
          updatedAt: new Date(),
        })
        .where('userId', '=', userId)
        .execute();

      return { ...existing, status };
    }

    await this.kysely
      .insertInto('user_subscription')
      .values({
        userId,
        status,
        updatedAt: new Date(),
      })
      .execute();

    return {
      userId,
      status,
      polarCustomerId: null,
      polarSubscriptionId: null,
      productId: null,
      currentPeriodEnd: null,
      adminPlanOverride: false,
    };
  }
}
