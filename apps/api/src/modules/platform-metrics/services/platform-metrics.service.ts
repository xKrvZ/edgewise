import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionDao } from '@/modules/billing/daos/subscription.dao';
import {
  PLATFORM_DAILY_METRIC,
  PLATFORM_EVENT_SOURCE,
  PLATFORM_EVENT_TYPE,
  ROLLUP_LOOKBACK_DAYS,
  type PlatformDailyMetric,
  type PlatformEventType,
} from '../constants/platform-metrics.constants';
import { PlatformDailyMetricDao } from '../daos/platform-daily-metric.dao';
import { PlatformEventDao, type PlatformEventInsert } from '../daos/platform-event.dao';
import {
  extractPolarCustomerId,
  extractPolarOccurredAt,
  extractPolarOrderAmountCents,
  extractPolarOrderId,
  extractPolarPeriodEnd,
  extractPolarProductId,
  extractPolarSubscriptionId,
  extractPolarSubscriptionStatus,
  extractPolarUserId,
  serializePolarPayload,
} from '../utils/polar-payload.util';

@Injectable()
export class PlatformMetricsService {
  private readonly logger = new Logger(PlatformMetricsService.name);

  constructor(
    private readonly platformEventDao: PlatformEventDao,
    private readonly platformDailyMetricDao: PlatformDailyMetricDao,
    private readonly subscriptionDao: SubscriptionDao,
  ) {}

  async ingestEvent(input: PlatformEventInsert): Promise<void> {
    const inserted = await this.platformEventDao.insertIfAbsent(input);
    if (!inserted) {
      return;
    }

    await this.bumpDailyMetricForEvent(inserted.type, inserted.occurredAt, inserted.amountCents);
  }

  async recordUserRegistered(user: { id: string; createdAt?: Date }): Promise<void> {
    const occurredAt = user.createdAt ?? new Date();

    await this.ingestEvent({
      source: PLATFORM_EVENT_SOURCE.AUTH,
      type: PLATFORM_EVENT_TYPE.USER_REGISTERED,
      idempotencyKey: `auth:user.registered:${user.id}`,
      userId: user.id,
      occurredAt,
      payload: { userId: user.id },
    });
  }

  async handlePolarOrderPaid(payload: unknown): Promise<void> {
    const orderId = extractPolarOrderId(payload);
    if (!orderId) {
      return;
    }

    const userId = await this.resolvePolarUserId(payload);
    const amountCents = extractPolarOrderAmountCents(payload);
    const occurredAt = extractPolarOccurredAt(payload);

    const serializedPayload = serializePolarPayload(payload);
    await this.ingestEvent({
      source: PLATFORM_EVENT_SOURCE.POLAR,
      type: PLATFORM_EVENT_TYPE.ORDER_PAID,
      idempotencyKey: `polar:order.paid:${orderId}`,
      userId,
      amountCents: amountCents > 0 ? amountCents : null,
      currency: 'usd',
      occurredAt,
      payload: {
        ...serializedPayload,
        amount: amountCents > 0 ? amountCents : null,
      },
    });
  }

  async handlePolarOrderRefunded(payload: unknown): Promise<void> {
    const orderId = extractPolarOrderId(payload);
    if (!orderId) {
      return;
    }

    const userId = await this.resolvePolarUserId(payload);
    const amountCents = extractPolarOrderAmountCents(payload);
    const occurredAt = extractPolarOccurredAt(payload);

    await this.ingestEvent({
      source: PLATFORM_EVENT_SOURCE.POLAR,
      type: PLATFORM_EVENT_TYPE.ORDER_REFUNDED,
      idempotencyKey: `polar:order.refunded:${orderId}`,
      userId,
      amountCents: amountCents > 0 ? -Math.abs(amountCents) : null,
      currency: 'usd',
      occurredAt,
      payload: serializePolarPayload(payload),
    });
  }

  async handlePolarSubscriptionLifecycle(
    payload: unknown,
    type: PlatformEventType,
    status: string,
  ): Promise<void> {
    const subscriptionId = extractPolarSubscriptionId(payload);
    if (!subscriptionId) {
      return;
    }

    const userId = await this.resolvePolarUserId(payload);
    const occurredAt = extractPolarOccurredAt(payload);

    await this.ingestEvent({
      source: PLATFORM_EVENT_SOURCE.POLAR,
      type,
      idempotencyKey: `polar:${type}:${subscriptionId}`,
      userId,
      occurredAt,
      payload: serializePolarPayload(payload),
    });

    if (userId) {
      await this.subscriptionDao.upsertFromPolar({
        userId,
        status,
        polarCustomerId: extractPolarCustomerId(payload),
        polarSubscriptionId: subscriptionId,
        productId: extractPolarProductId(payload),
        currentPeriodEnd: extractPolarPeriodEnd(payload),
      });
    }
  }

  async handlePolarSubscriptionActive(payload: unknown): Promise<void> {
    const status = extractPolarSubscriptionStatus(payload) ?? 'active';
    await this.handlePolarSubscriptionLifecycle(
      payload,
      PLATFORM_EVENT_TYPE.SUBSCRIPTION_ACTIVE,
      status,
    );
  }

  async handlePolarSubscriptionCanceled(payload: unknown): Promise<void> {
    const status = extractPolarSubscriptionStatus(payload) ?? 'canceled';
    await this.handlePolarSubscriptionLifecycle(
      payload,
      PLATFORM_EVENT_TYPE.SUBSCRIPTION_CANCELED,
      status,
    );
  }

  async handlePolarSubscriptionRevoked(payload: unknown): Promise<void> {
    const status = extractPolarSubscriptionStatus(payload) ?? 'revoked';
    await this.handlePolarSubscriptionLifecycle(
      payload,
      PLATFORM_EVENT_TYPE.SUBSCRIPTION_REVOKED,
      status,
    );
  }

  async getUserSignupSeries(since: Date): Promise<{ date: string; count: number }[]> {
    const hasRollup = await this.platformDailyMetricDao.hasAnySince(
      PLATFORM_DAILY_METRIC.USER_SIGNUPS,
      since,
    );

    if (hasRollup) {
      const rows = await this.platformDailyMetricDao.getSeries(
        PLATFORM_DAILY_METRIC.USER_SIGNUPS,
        since,
      );
      return rows.map((row) => ({
        date: row.metricDate,
        count: Math.round(row.value),
      }));
    }

    return this.queryUserSignupSeries(since);
  }

  async getRevenueSeries(since: Date): Promise<{ date: string; amount: number }[] | null> {
    const hasRollup = await this.platformDailyMetricDao.hasAnySince(
      PLATFORM_DAILY_METRIC.REVENUE_CENTS,
      since,
    );

    if (!hasRollup) {
      return null;
    }

    const rows = await this.platformDailyMetricDao.getSeries(
      PLATFORM_DAILY_METRIC.REVENUE_CENTS,
      since,
    );

    return rows.map((row) => ({
      date: row.metricDate,
      amount: Number((row.value / 100).toFixed(2)),
    }));
  }

  async getRevenueTotalSince(since: Date): Promise<number | null> {
    const hasRollup = await this.platformDailyMetricDao.hasAnySince(
      PLATFORM_DAILY_METRIC.REVENUE_CENTS,
      since,
    );

    if (!hasRollup) {
      return null;
    }

    const cents = await this.platformDailyMetricDao.sumSince(
      PLATFORM_DAILY_METRIC.REVENUE_CENTS,
      since,
    );

    return Number((cents / 100).toFixed(2));
  }

  async rebuildDailyRollups(): Promise<void> {
    const since = this.rollupSinceDate();
    this.logger.log(`Rebuilding platform daily metrics since ${since.toISOString().slice(0, 10)}`);

    await this.rebuildUserSignupRollups(since);
    await this.rebuildEventRollups(since);
  }

  private async rebuildUserSignupRollups(since: Date): Promise<void> {
    const rows = await this.queryUserSignupSeries(since);
    for (const row of rows) {
      await this.platformDailyMetricDao.upsert(
        row.date,
        PLATFORM_DAILY_METRIC.USER_SIGNUPS,
        row.count,
      );
    }
  }

  private async rebuildEventRollups(since: Date): Promise<void> {
    const eventMetricMap: Array<{
      type: PlatformEventType;
      metric: PlatformDailyMetric;
      amountField?: boolean;
    }> = [
      {
        type: PLATFORM_EVENT_TYPE.ORDER_PAID,
        metric: PLATFORM_DAILY_METRIC.REVENUE_CENTS,
        amountField: true,
      },
      {
        type: PLATFORM_EVENT_TYPE.ORDER_REFUNDED,
        metric: PLATFORM_DAILY_METRIC.REVENUE_CENTS,
        amountField: true,
      },
      {
        type: PLATFORM_EVENT_TYPE.SUBSCRIPTION_ACTIVE,
        metric: PLATFORM_DAILY_METRIC.SUBSCRIPTIONS_ACTIVATED,
      },
      {
        type: PLATFORM_EVENT_TYPE.SUBSCRIPTION_CANCELED,
        metric: PLATFORM_DAILY_METRIC.SUBSCRIPTIONS_CANCELED,
      },
      {
        type: PLATFORM_EVENT_TYPE.SUBSCRIPTION_REVOKED,
        metric: PLATFORM_DAILY_METRIC.SUBSCRIPTIONS_CANCELED,
      },
    ];

    const revenueByDate = new Map<string, number>();

    for (const mapping of eventMetricMap) {
      const aggregates = await this.platformEventDao.aggregateByDay({
        type: mapping.type,
        since,
        amountField: mapping.amountField,
      });

      if (mapping.metric === PLATFORM_DAILY_METRIC.REVENUE_CENTS) {
        for (const aggregate of aggregates) {
          revenueByDate.set(
            aggregate.metricDate,
            (revenueByDate.get(aggregate.metricDate) ?? 0) + aggregate.value,
          );
        }
        continue;
      }

      for (const aggregate of aggregates) {
        await this.platformDailyMetricDao.upsert(
          aggregate.metricDate,
          mapping.metric,
          aggregate.value,
        );
      }
    }

    for (const [metricDate, value] of revenueByDate.entries()) {
      await this.platformDailyMetricDao.upsert(
        metricDate,
        PLATFORM_DAILY_METRIC.REVENUE_CENTS,
        value,
      );
    }
  }

  private async bumpDailyMetricForEvent(
    type: PlatformEventType | string,
    occurredAt: Date,
    amountCents: number | null,
  ): Promise<void> {
    const metricDate = occurredAt.toISOString().slice(0, 10);

    switch (type) {
      case PLATFORM_EVENT_TYPE.USER_REGISTERED:
        await this.platformDailyMetricDao.increment(
          metricDate,
          PLATFORM_DAILY_METRIC.USER_SIGNUPS,
          1,
        );
        break;
      case PLATFORM_EVENT_TYPE.ORDER_PAID:
        if (amountCents && amountCents > 0) {
          await this.platformDailyMetricDao.increment(
            metricDate,
            PLATFORM_DAILY_METRIC.REVENUE_CENTS,
            amountCents,
          );
        }
        break;
      case PLATFORM_EVENT_TYPE.ORDER_REFUNDED:
        if (amountCents && amountCents !== 0) {
          await this.platformDailyMetricDao.increment(
            metricDate,
            PLATFORM_DAILY_METRIC.REVENUE_CENTS,
            amountCents,
          );
        }
        break;
      case PLATFORM_EVENT_TYPE.SUBSCRIPTION_ACTIVE:
        await this.platformDailyMetricDao.increment(
          metricDate,
          PLATFORM_DAILY_METRIC.SUBSCRIPTIONS_ACTIVATED,
          1,
        );
        break;
      case PLATFORM_EVENT_TYPE.SUBSCRIPTION_CANCELED:
      case PLATFORM_EVENT_TYPE.SUBSCRIPTION_REVOKED:
        await this.platformDailyMetricDao.increment(
          metricDate,
          PLATFORM_DAILY_METRIC.SUBSCRIPTIONS_CANCELED,
          1,
        );
        break;
      default:
        break;
    }
  }

  private async resolvePolarUserId(payload: unknown): Promise<string | null> {
    const directUserId = extractPolarUserId(payload);
    if (directUserId) {
      return directUserId;
    }

    const polarCustomerId = extractPolarCustomerId(payload);
    if (!polarCustomerId) {
      return null;
    }

    return this.subscriptionDao.findUserIdByPolarCustomerId(polarCustomerId);
  }

  private async queryUserSignupSeries(since: Date): Promise<{ date: string; count: number }[]> {
    const rows = await this.platformDailyMetricDao.getUserSignupSeriesFromUsers(since);
    return rows.map((row) => ({
      date: row.metricDate,
      count: Math.round(row.value),
    }));
  }

  private rollupSinceDate(): Date {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (ROLLUP_LOOKBACK_DAYS - 1));
    return since;
  }
}
