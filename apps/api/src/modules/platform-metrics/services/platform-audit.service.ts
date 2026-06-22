import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  PLATFORM_EVENT_SOURCE,
  PLATFORM_EVENT_TYPE,
  USER_AUDIT_EVENT_TYPES,
} from '../constants/platform-metrics.constants';
import { PlatformEventDao } from '../daos/platform-event.dao';
import {
  formatAuditEventDetail,
  formatAuditEventLabel,
} from '../utils/audit-labels.util';

export interface AuditLogEntry {
  id: string;
  type: string;
  label: string;
  detail: string | null;
  source: string;
  occurredAt: string;
  subjectUserId: string | null;
  subjectEmail: string | null;
  subjectName: string | null;
  subjectDisplayName: string | null;
  actorUserId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  actorDisplayName: string | null;
  payload: Record<string, unknown>;
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class PlatformAuditService {
  constructor(private readonly platformEventDao: PlatformEventDao) {}

  async listAdminAuditLog(limit: number, offset: number): Promise<AuditLogPage> {
    const { items, total } = await this.platformEventDao.listAdminEvents({ limit, offset });
    return {
      items: items.map((row) => this.toAuditEntry(row)),
      total,
      limit,
      offset,
    };
  }

  async listUserAuditLog(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<AuditLogPage> {
    const { items, total } = await this.platformEventDao.listUserEvents({
      userId,
      types: USER_AUDIT_EVENT_TYPES,
      limit,
      offset,
    });

    return {
      items: items.map((row) => this.toAuditEntry(row)),
      total,
      limit,
      offset,
    };
  }

  async recordAdminUserBanned(params: {
    actorUserId: string;
    userId: string;
    banReason?: string | null;
  }): Promise<void> {
    await this.platformEventDao.insertAuditEvent({
      source: PLATFORM_EVENT_SOURCE.ADMIN,
      type: PLATFORM_EVENT_TYPE.ADMIN_USER_BANNED,
      idempotencyKey: `admin:user.banned:${randomUUID()}`,
      userId: params.userId,
      actorUserId: params.actorUserId,
      occurredAt: new Date(),
      payload: {
        banReason: params.banReason ?? null,
      },
    });
  }

  async recordAdminUserUnbanned(params: {
    actorUserId: string;
    userId: string;
  }): Promise<void> {
    await this.platformEventDao.insertAuditEvent({
      source: PLATFORM_EVENT_SOURCE.ADMIN,
      type: PLATFORM_EVENT_TYPE.ADMIN_USER_UNBANNED,
      idempotencyKey: `admin:user.unbanned:${randomUUID()}`,
      userId: params.userId,
      actorUserId: params.actorUserId,
      occurredAt: new Date(),
      payload: {},
    });
  }

  async recordAdminRoleChanged(params: {
    actorUserId: string;
    userId: string;
    previousRole: string | null;
    newRole: string;
  }): Promise<void> {
    await this.platformEventDao.insertAuditEvent({
      source: PLATFORM_EVENT_SOURCE.ADMIN,
      type: PLATFORM_EVENT_TYPE.ADMIN_USER_ROLE_CHANGED,
      idempotencyKey: `admin:user.role_changed:${randomUUID()}`,
      userId: params.userId,
      actorUserId: params.actorUserId,
      occurredAt: new Date(),
      payload: {
        previousRole: params.previousRole,
        newRole: params.newRole,
      },
    });
  }

  async recordAdminSubscriptionOverride(params: {
    actorUserId: string;
    userId: string;
    previousStatus: string | null;
    newStatus: string;
  }): Promise<void> {
    await this.platformEventDao.insertAuditEvent({
      source: PLATFORM_EVENT_SOURCE.ADMIN,
      type: PLATFORM_EVENT_TYPE.ADMIN_SUBSCRIPTION_OVERRIDE,
      idempotencyKey: `admin:subscription.override:${randomUUID()}`,
      userId: params.userId,
      actorUserId: params.actorUserId,
      occurredAt: new Date(),
      payload: {
        previousStatus: params.previousStatus,
        newStatus: params.newStatus,
      },
    });
  }

  async recordAdminSubscriptionPlanChanged(params: {
    actorUserId: string;
    userId: string;
    previousPlan: string | null;
    newPlan: string;
    productId?: string | null;
  }): Promise<void> {
    await this.platformEventDao.insertAuditEvent({
      source: PLATFORM_EVENT_SOURCE.ADMIN,
      type: PLATFORM_EVENT_TYPE.ADMIN_SUBSCRIPTION_PLAN_CHANGED,
      idempotencyKey: `admin:subscription.plan_changed:${randomUUID()}`,
      userId: params.userId,
      actorUserId: params.actorUserId,
      occurredAt: new Date(),
      payload: {
        previousPlan: params.previousPlan,
        newPlan: params.newPlan,
        productId: params.productId ?? null,
      },
    });
  }

  async recordAdminSubscriptionCanceled(params: {
    actorUserId: string;
    userId: string;
    mode: 'immediate' | 'period_end';
    subscriptionId?: string | null;
  }): Promise<void> {
    await this.platformEventDao.insertAuditEvent({
      source: PLATFORM_EVENT_SOURCE.ADMIN,
      type: PLATFORM_EVENT_TYPE.ADMIN_SUBSCRIPTION_CANCELED,
      idempotencyKey: `admin:subscription.canceled:${randomUUID()}`,
      userId: params.userId,
      actorUserId: params.actorUserId,
      occurredAt: new Date(),
      payload: {
        mode: params.mode,
        subscriptionId: params.subscriptionId ?? null,
      },
    });
  }

  async recordAdminOrderRefunded(params: {
    actorUserId: string;
    userId: string;
    orderId: string;
    amount: number;
    currency: string;
    reason?: string | null;
  }): Promise<void> {
    await this.platformEventDao.insertAuditEvent({
      source: PLATFORM_EVENT_SOURCE.ADMIN,
      type: PLATFORM_EVENT_TYPE.ADMIN_ORDER_REFUNDED,
      idempotencyKey: `admin:order.refunded:${params.orderId}:${randomUUID()}`,
      userId: params.userId,
      actorUserId: params.actorUserId,
      occurredAt: new Date(),
      amountCents: -Math.abs(params.amount),
      currency: params.currency,
      payload: {
        orderId: params.orderId,
        amount: params.amount,
        currency: params.currency,
        reason: params.reason ?? null,
      },
    });
  }

  async recordAdminAccountLimitChanged(params: {
    actorUserId: string;
    userId: string;
    previousOverride: number | null;
    newOverride: number | null;
    previousMaxAccounts: number;
    newMaxAccounts: number;
  }): Promise<void> {
    await this.platformEventDao.insertAuditEvent({
      source: PLATFORM_EVENT_SOURCE.ADMIN,
      type: PLATFORM_EVENT_TYPE.ADMIN_ACCOUNT_LIMIT_CHANGED,
      idempotencyKey: `admin:account_limit.changed:${randomUUID()}`,
      userId: params.userId,
      actorUserId: params.actorUserId,
      occurredAt: new Date(),
      payload: {
        previousOverride: params.previousOverride,
        newOverride: params.newOverride,
        previousMaxAccounts: params.previousMaxAccounts,
        newMaxAccounts: params.newMaxAccounts,
      },
    });
  }

  private toAuditEntry(row: {
    id: string;
    type: string;
    source: string;
    occurredAt: Date;
    userId: string | null;
    actorUserId: string | null;
    payload: Record<string, unknown>;
    subjectEmail: string | null;
    subjectName: string | null;
    subjectDisplayName: string | null;
    actorEmail: string | null;
    actorName: string | null;
    actorDisplayName: string | null;
  }): AuditLogEntry {
    return {
      id: row.id,
      type: row.type,
      label: formatAuditEventLabel(row.type),
      detail: formatAuditEventDetail(row.type, row.payload),
      source: row.source,
      occurredAt: row.occurredAt.toISOString(),
      subjectUserId: row.userId,
      subjectEmail: row.subjectEmail,
      subjectName: row.subjectName,
      subjectDisplayName: row.subjectDisplayName,
      actorUserId: row.actorUserId,
      actorEmail: row.actorEmail,
      actorName: row.actorName,
      actorDisplayName: row.actorDisplayName,
      payload: row.payload,
    };
  }
}
