import { Injectable, Logger } from '@nestjs/common';
import { createPolarClient } from '@/auth/polar.plugin';
import billingConfig from '@/config/billing.config';
import { BillingService } from '@/modules/billing/services/billing.service';
import { PlatformMetricsService } from '@/modules/platform-metrics/services/platform-metrics.service';
import { POSTHOG_ACTIVATION_FUNNEL_STEPS } from '../constants/posthog-funnel.constants';
import { AdminDao } from '../daos/admin.dao';
import type { AdminStatsPeriod } from '../dtos/admin-stats-query.dto';
import {
  AdminDashboardStatsDto,
  AdminStatsActivationFunnelDto,
  AdminStatsActivationFunnelStepDto,
  AdminStatsDto,
  AdminStatsGrowthDto,
  AdminStatsRevenueDto,
  AdminStatsSubscriptionsDto,
  AdminStatsUsersDto,
} from '../dtos/admin-stats.dto';
import {
  computeGrowthPercent,
  fillDailyRevenueSeries,
  fillDailySeries,
  mergeDailyMetricsSeries,
  parsePeriodDays,
  startOfCalendarMonth,
  startOfDay,
  subDays,
  sumSeriesAmounts,
  sumSeriesCounts,
  sumSeriesSliceAmounts,
  toDateKey,
} from '../utils/admin-stats.utils';
import { AdminPostHogService } from './admin-posthog.service';

const MOCK_MONTHLY_PRICE = 29;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly adminDao: AdminDao,
    private readonly billingService: BillingService,
    private readonly platformMetricsService: PlatformMetricsService,
    private readonly adminPostHogService: AdminPostHogService,
  ) {}

  async getDashboardStats(): Promise<AdminDashboardStatsDto> {
    const monthStart = startOfCalendarMonth(new Date());

    const [
      totalUsers,
      activeSubscriptions,
      totalTrades,
      tradesThisMonth,
      totalJournals,
      journalsThisMonth,
      totalCommunities,
      communitiesThisMonth,
      totalPosts,
      postsThisMonth,
    ] = await Promise.all([
      this.adminDao.countUsers(),
      this.adminDao.countSubscriptionsByStatus('active'),
      this.adminDao.countTrades(),
      this.adminDao.countTradesSince(monthStart),
      this.adminDao.countTradingAccounts(),
      this.adminDao.countTradingAccountsSince(monthStart),
      this.adminDao.countCommunities(),
      this.adminDao.countCommunitiesSince(monthStart),
      this.adminDao.countCommunityPosts(),
      this.adminDao.countCommunityPostsSince(monthStart),
    ]);

    return {
      users: { total: totalUsers },
      subscriptions: { active: activeSubscriptions },
      trades: { total: totalTrades, thisMonth: tradesThisMonth },
      journals: { total: totalJournals, thisMonth: journalsThisMonth },
      communities: { total: totalCommunities, thisMonth: communitiesThisMonth },
      posts: { total: totalPosts, thisMonth: postsThisMonth },
    };
  }

  async getAnalyticsStats(period: AdminStatsPeriod = '30d'): Promise<AdminStatsDto> {
    return this.adminPostHogService.fetchAnalyticsStats(period);
  }

  private async buildPostHogActivationFunnel(period: AdminStatsPeriod): Promise<{
    activation: AdminStatsActivationFunnelDto;
    posthogFunnelError: boolean;
    posthogFunnelAvailable: boolean;
  }> {
    const emptySteps = this.emptyActivationFunnelSteps();
    const configured = this.adminPostHogService.isConfigured();

    if (!configured) {
      return {
        activation: { source: 'posthog', steps: emptySteps, periodSteps: emptySteps },
        posthogFunnelError: false,
        posthogFunnelAvailable: false,
      };
    }

    const [allTimeSteps, periodSteps] = await Promise.all([
      this.adminPostHogService.fetchActivationFunnel(period, 'all_time'),
      this.adminPostHogService.fetchActivationFunnel(period, 'period'),
    ]);

    const funnelQueryFailed = allTimeSteps === null && periodSteps === null;
    const resolvedAllTime = allTimeSteps ?? emptySteps;
    const resolvedPeriod = periodSteps ?? emptySteps;
    const funnelAvailable =
      resolvedAllTime.some((step) => step.count > 0) ||
      resolvedPeriod.some((step) => step.count > 0);

    return {
      activation: {
        source: 'posthog',
        steps: resolvedAllTime,
        periodSteps: resolvedPeriod,
      },
      posthogFunnelError: funnelQueryFailed,
      posthogFunnelAvailable: funnelAvailable,
    };
  }

  private emptyActivationFunnelSteps(): AdminStatsActivationFunnelStepDto[] {
    return POSTHOG_ACTIVATION_FUNNEL_STEPS.map((definition) => ({
      key: definition.key,
      label: definition.label,
      shortLabel: definition.shortLabel,
      event: definition.event,
      count: 0,
    }));
  }

  private async buildUserGrowth(): Promise<AdminStatsGrowthDto> {
    const now = new Date();
    const startOfToday = startOfDay(now);

    const [
      todaySignups,
      yesterdaySignups,
      last7dSignups,
      prior7dSignups,
      last30dSignups,
      prior30dSignups,
    ] = await Promise.all([
      this.adminDao.countUsersSince(startOfToday),
      this.adminDao.countUsersBetween(subDays(startOfToday, 1), startOfToday),
      this.adminDao.countUsersSince(subDays(now, 7)),
      this.adminDao.countUsersBetween(subDays(now, 14), subDays(now, 7)),
      this.adminDao.countUsersSince(subDays(now, 30)),
      this.adminDao.countUsersBetween(subDays(now, 60), subDays(now, 30)),
    ]);

    return {
      daily: computeGrowthPercent(todaySignups, yesterdaySignups),
      weekly: computeGrowthPercent(last7dSignups, prior7dSignups),
      monthly: computeGrowthPercent(last30dSignups, prior30dSignups),
    };
  }

  private async buildSubscriptionGrowth(): Promise<AdminStatsGrowthDto> {
    const now = new Date();
    const startOfToday = startOfDay(now);

    const [
      todayActive,
      yesterdayActive,
      last7dActive,
      prior7dActive,
      last30dActive,
      prior30dActive,
    ] = await Promise.all([
      this.adminDao.countSubscriptionsSince('active', startOfToday),
      this.adminDao.countSubscriptionsBetween('active', subDays(startOfToday, 1), startOfToday),
      this.adminDao.countSubscriptionsSince('active', subDays(now, 7)),
      this.adminDao.countSubscriptionsBetween('active', subDays(now, 14), subDays(now, 7)),
      this.adminDao.countSubscriptionsSince('active', subDays(now, 30)),
      this.adminDao.countSubscriptionsBetween('active', subDays(now, 60), subDays(now, 30)),
    ]);

    return {
      daily: computeGrowthPercent(todayActive, yesterdayActive),
      weekly: computeGrowthPercent(last7dActive, prior7dActive),
      monthly: computeGrowthPercent(last30dActive, prior30dActive),
    };
  }

  private async getPriorPeriodRevenueTotal(
    periodDays: number,
    since: Date,
    activeSubscriptions: number,
  ): Promise<number> {
    const priorSince = subDays(since, periodDays);
    const priorUserSeriesRaw = await this.platformMetricsService.getUserSignupSeries(priorSince);
    const priorUserSeries = fillDailySeries(priorUserSeriesRaw, periodDays);

    const { revenue } = await this.buildRevenueMetrics(
      periodDays,
      priorSince,
      priorUserSeries,
      activeSubscriptions,
    );

    return revenue.total;
  }

  private async buildRevenueMetrics(
    periodDays: number,
    since: Date,
    userSeries: { date: string; count: number }[],
    activeSubscriptions: number,
  ): Promise<{ revenue: AdminStatsRevenueDto; revenueSource: AdminStatsDto['revenueSource'] }> {
    if (this.billingService.isMockMode()) {
      return {
        revenueSource: 'mock',
        revenue: this.buildMockRevenue(periodDays, userSeries, activeSubscriptions),
      };
    }

    const rollupResult = await this.buildRollupRevenue(since, periodDays);
    if (rollupResult) {
      return rollupResult;
    }

    const polarResult = await this.fetchPolarRevenue(since, periodDays);
    if (polarResult) {
      return polarResult;
    }

    return {
      revenueSource: 'estimate',
      revenue: await this.buildEstimatedRevenue(periodDays, since, activeSubscriptions),
    };
  }

  private async buildRollupRevenue(
    since: Date,
    periodDays: number,
  ): Promise<{ revenue: AdminStatsRevenueDto; revenueSource: 'rollup' } | null> {
    const rawSeries = await this.platformMetricsService.getRevenueSeries(since);
    if (!rawSeries) {
      return null;
    }

    const series = fillDailyRevenueSeries(rawSeries, periodDays);
    const total =
      (await this.platformMetricsService.getRevenueTotalSince(since)) ??
      sumSeriesAmounts(series, periodDays);

    return {
      revenueSource: 'rollup',
      revenue: this.finalizeRevenueMetrics(series, total),
    };
  }

  private buildMockRevenue(
    periodDays: number,
    userSeries: { date: string; count: number }[],
    activeSubscriptions: number,
  ): AdminStatsRevenueDto {
    const dailyRecurring = (activeSubscriptions * MOCK_MONTHLY_PRICE) / 30;
    const rawSeries = userSeries.map(({ date, count }) => ({
      date,
      amount: Number((dailyRecurring + count * MOCK_MONTHLY_PRICE * 0.12).toFixed(2)),
    }));
    const series = fillDailyRevenueSeries(rawSeries, periodDays);

    return this.finalizeRevenueMetrics(series, sumSeriesAmounts(series, periodDays));
  }

  private async buildEstimatedRevenue(
    periodDays: number,
    since: Date,
    activeSubscriptions: number,
  ): Promise<AdminStatsRevenueDto> {
    const subscriptionSeries = await this.adminDao.getActiveSubscriptionSeries(since);
    const dailyPrice = MOCK_MONTHLY_PRICE / 30;
    const rawSeries = subscriptionSeries.map(({ date, count }) => ({
      date,
      amount: Number((count * MOCK_MONTHLY_PRICE + activeSubscriptions * dailyPrice).toFixed(2)),
    }));
    const series = fillDailyRevenueSeries(rawSeries, periodDays);

    return this.finalizeRevenueMetrics(series, sumSeriesAmounts(series, periodDays));
  }

  private async fetchPolarRevenue(
    since: Date,
    periodDays: number,
  ): Promise<{ revenue: AdminStatsRevenueDto; revenueSource: 'polar' } | null> {
    const polarClient = createPolarClient();
    const organizationId = billingConfig.polar.organizationId;

    if (!polarClient || !organizationId) {
      return null;
    }

    try {
      const amountByDate = new Map<string, number>();
      let total = 0;

      const iterator = await polarClient.orders.list({
        organizationId,
        productId: billingConfig.polar.productId || undefined,
        limit: 100,
      });

      for await (const page of iterator) {
        const items = this.extractOrderItems(page);
        for (const order of items) {
          const createdAt = this.readOrderDate(order);
          const amount = this.readOrderAmount(order);
          if (!createdAt || amount <= 0 || createdAt < since) {
            continue;
          }

          const date = createdAt.toISOString().slice(0, 10);
          amountByDate.set(date, (amountByDate.get(date) ?? 0) + amount);
          total += amount;
        }
      }

      const rawSeries = [...amountByDate.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, amount]) => ({ date, amount: Number(amount.toFixed(2)) }));

      const series = fillDailyRevenueSeries(rawSeries, periodDays);
      return {
        revenueSource: 'polar',
        revenue: this.finalizeRevenueMetrics(series, Number(total.toFixed(2))),
      };
    } catch (error) {
      this.logger.debug(
        `Polar orders unavailable for admin revenue: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  private finalizeRevenueMetrics(
    series: { date: string; amount: number }[],
    total: number,
  ): AdminStatsRevenueDto {
    const growth = {
      daily: computeGrowthPercent(
        sumSeriesAmounts(series, 1),
        series.length > 1 ? (series[series.length - 2]?.amount ?? 0) : 0,
      ),
      weekly: computeGrowthPercent(
        sumSeriesAmounts(series, 7),
        sumSeriesSliceAmounts(series, 7, 7),
      ),
      monthly: computeGrowthPercent(
        sumSeriesAmounts(series, 30),
        sumSeriesSliceAmounts(series, 30, 30),
      ),
    };

    return {
      total,
      last24h: sumSeriesAmounts(series, 1),
      last7d: sumSeriesAmounts(series, 7),
      last30d: sumSeriesAmounts(series, 30),
      growth,
      series,
    };
  }

  private extractOrderItems(page: unknown): unknown[] {
    if (!page || typeof page !== 'object') {
      return [];
    }

    if ('result' in page) {
      const result = (page as { result?: { items?: unknown[] } }).result;
      if (Array.isArray(result?.items)) {
        return result.items;
      }
    }

    if ('items' in page && Array.isArray((page as { items: unknown[] }).items)) {
      return (page as { items: unknown[] }).items;
    }

    return [];
  }

  private readOrderDate(order: unknown): Date | null {
    if (!order || typeof order !== 'object') {
      return null;
    }

    const record = order as Record<string, unknown>;
    const raw = record.createdAt ?? record.created_at;
    if (typeof raw === 'string' || raw instanceof Date) {
      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  private readOrderAmount(order: unknown): number {
    if (!order || typeof order !== 'object') {
      return 0;
    }

    const record = order as Record<string, unknown>;
    const candidates = [
      record.amount,
      record.totalAmount,
      record.total_amount,
      record.netAmount,
      record.net_amount,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate / 100;
      }
    }

    return 0;
  }
}