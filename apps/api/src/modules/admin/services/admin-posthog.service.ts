import { Injectable, Logger } from '@nestjs/common';

import posthogConfig from '@/config/posthog.config';

import {

  POSTHOG_DAILY_TREND_SERIES,

  type PostHogTrendSeriesDef,

} from '../constants/posthog-analytics.constants';

import {

  POSTHOG_ACTIVATION_FUNNEL_STEPS,

  type PostHogActivationFunnelStepDef,

} from '../constants/posthog-funnel.constants';

import type { AdminStatsPeriod } from '../dtos/admin-stats-query.dto';

import type {

  AdminStatsActivationFunnelStepDto,

  AdminStatsActivationTrendPointDto,

  AdminStatsDto,

} from '../dtos/admin-stats.dto';

import {

  buildWeeklyActivationTrend,

  computeGrowthPercent,

  fillDailySeries,

  mergeDailyMetricsSeries,

  parsePeriodDays,

  startOfDay,

  subDays,

  sumSeriesCounts,

  toDateKey,

} from '../utils/admin-stats.utils';



interface PostHogFunnelStepResult {

  count?: number;

  order?: number | string;

}



interface PostHogTrendResult {

  data?: number[];

  days?: string[];

  labels?: string[];

}



interface PostHogQueryResponse {

  results?: PostHogFunnelStepResult[] | PostHogTrendResult[];

  detail?: string;

}



type DailySeriesMap = Map<string, { date: string; count: number }[]>;



@Injectable()

export class AdminPostHogService {

  private readonly logger = new Logger(AdminPostHogService.name);



  isConfigured(): boolean {

    return posthogConfig.enabled;

  }



  async fetchAnalyticsStats(period: AdminStatsPeriod): Promise<AdminStatsDto> {

    if (!this.isConfigured()) {

      return this.buildEmptyAnalyticsStats(period);

    }



    try {

      return await this.buildPostHogAnalyticsStats(period);

    } catch (error) {

      this.logger.warn(

        `PostHog analytics unavailable (${period}): ${error instanceof Error ? error.message : error}`,

      );

      return this.buildEmptyAnalyticsStats(period, true);

    }

  }



  async fetchActivationFunnel(

    period: AdminStatsPeriod,

    scope: 'all_time' | 'period',

  ): Promise<AdminStatsActivationFunnelStepDto[] | null> {

    if (!this.isConfigured()) {

      return null;

    }



    const periodDays = parsePeriodDays(period);

    const dateRange =

      scope === 'all_time'

        ? { date_from: '-3650d' as const }

        : { date_from: `-${periodDays}d` as const };

    const funnelWindowDays = scope === 'all_time' ? 90 : periodDays;



    try {

      const response = await this.queryFunnel(dateRange, funnelWindowDays);

      return this.mapFunnelResults(response);

    } catch (error) {

      this.logger.debug(

        `PostHog activation funnel unavailable (${scope}, ${period}): ${

          error instanceof Error ? error.message : error

        }`,

      );

      return null;

    }

  }



  async fetchActivationTrend(

    period: AdminStatsPeriod,

  ): Promise<AdminStatsActivationTrendPointDto[] | null> {

    if (!this.isConfigured()) {

      return null;

    }



    const periodDays = parsePeriodDays(period);



    try {

      const trends = await this.fetchDailyTrends(periodDays);

      const signups = trends.get('signups') ?? fillDailySeries([], periodDays);

      const journals = trends.get('journals') ?? fillDailySeries([], periodDays);

      const communityJoins = trends.get('communityJoins') ?? fillDailySeries([], periodDays);

      const subscriptions = trends.get('subscriptions') ?? fillDailySeries([], periodDays);

      const firstTrades = this.mergeFirstTradeSeries(trends, periodDays);



      return buildWeeklyActivationTrend(

        periodDays,

        signups,

        journals,

        firstTrades,

        communityJoins,

        subscriptions,

      );

    } catch (error) {

      this.logger.debug(

        `PostHog activation trend unavailable (${period}): ${

          error instanceof Error ? error.message : error

        }`,

      );

      return null;

    }

  }



  private mergeFirstTradeSeries(

    trends: DailySeriesMap,

    periodDays: number,

  ): { date: string; count: number }[] {

    const imported = trends.get('firstTradeImported') ?? fillDailySeries([], periodDays);

    const logged = trends.get('firstTradeLogged') ?? fillDailySeries([], periodDays);

    const loggedMap = new Map(logged.map((point) => [point.date, point.count]));



    return imported.map(({ date, count }) => ({

      date,

      count: count + (loggedMap.get(date) ?? 0),

    }));

  }



  private buildTrendSeriesNodes(definitions: PostHogTrendSeriesDef[]): Record<string, unknown>[] {

    return definitions.map((def) => {

      const node: Record<string, unknown> = {

        kind: 'EventsNode',

        event: def.event,

        name: def.name,

        math: 'total',

      };



      if (def.properties?.length) {

        node.properties = def.properties;

      }



      return node;

    });

  }



  private buildSeriesNode(step: PostHogActivationFunnelStepDef): Record<string, unknown> {

    if ('group' in step && step.group) {

      return {

        kind: 'GroupNode',

        operator: step.group.operator,

        nodes: step.group.nodes,

      };

    }



    const node: Record<string, unknown> = {

      kind: 'EventsNode',

      event: step.event,

      name: step.label,

    };



    if ('properties' in step && step.properties) {

      node.properties = step.properties;

    }



    return node;

  }



  private async queryPostHog(body: Record<string, unknown>): Promise<PostHogQueryResponse> {

    const url = `${posthogConfig.host}/api/projects/${posthogConfig.projectId}/query/`;



    const response = await fetch(url, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        Authorization: `Bearer ${posthogConfig.personalApiKey}`,

      },

      body: JSON.stringify(body),

    });



    const payload = (await response.json()) as PostHogQueryResponse & {

      query_status?: { complete?: boolean };

    };



    if (!response.ok) {

      throw new Error(payload.detail ?? `PostHog query failed (${response.status})`);

    }



    if (payload.query_status && payload.query_status.complete === false) {

      throw new Error('PostHog query did not complete synchronously');

    }



    return payload;

  }



  private async queryFunnel(

    dateRange: { date_from: string; date_to?: string },

    funnelWindowDays: number,

  ): Promise<PostHogQueryResponse> {

    return this.queryPostHog({

      name: `admin_activation_funnel_${dateRange.date_from}`,

      query: {

        kind: 'FunnelsQuery',

        dateRange,

        series: POSTHOG_ACTIVATION_FUNNEL_STEPS.map((step) => this.buildSeriesNode(step)),

        funnelsFilter: {

          funnelOrderType: 'ordered',

          funnelWindowInterval: funnelWindowDays,

          funnelWindowIntervalUnit: 'day',

        },

      },

    });

  }



  private async queryTrends(

    dateRange: { date_from: string; date_to?: string },

    interval: 'day' | 'week',

  ): Promise<PostHogQueryResponse> {

    return this.queryPostHog({

      name: `admin_activation_trend_${dateRange.date_from}`,

      query: {

        kind: 'TrendsQuery',

        dateRange,

        interval,

        series: this.buildTrendSeriesNodes(POSTHOG_DAILY_TREND_SERIES),

      },

    });

  }



  private mapTrendResults(response: PostHogQueryResponse, periodDays: number): DailySeriesMap {

    const results = Array.isArray(response.results)

      ? (response.results as PostHogTrendResult[])

      : [];

    const map: DailySeriesMap = new Map();



    POSTHOG_DAILY_TREND_SERIES.forEach((def, index) => {

      const result = results[index];

      map.set(def.key, fillDailySeries(this.extractDailyPoints(result), periodDays));

    });



    return map;

  }



  private extractDailyPoints(result: PostHogTrendResult | undefined): { date: string; count: number }[] {

    if (!result?.data?.length) {

      return [];

    }



    const days = result.days ?? result.labels ?? [];



    return result.data.map((count, index) => {

      const rawDay = days[index];

      const date =

        typeof rawDay === 'string' && rawDay.length >= 10

          ? rawDay.slice(0, 10)

          : toDateKey(subDays(startOfDay(new Date()), result.data!.length - 1 - index));



      return { date, count: Number(count ?? 0) };

    });

  }



  private mapFunnelResults(response: PostHogQueryResponse): AdminStatsActivationFunnelStepDto[] {

    const results = Array.isArray(response.results)

      ? (response.results as PostHogFunnelStepResult[])

      : [];



    const countsByOrder = new Map<number, number>();

    for (const step of results) {

      const order = Number(step.order ?? countsByOrder.size);

      countsByOrder.set(order, Number(step.count ?? 0));

    }



    return POSTHOG_ACTIVATION_FUNNEL_STEPS.map((definition, index) => ({

      key: definition.key,

      label: definition.label,

      shortLabel: definition.shortLabel,

      event: definition.event,

      count: countsByOrder.get(index) ?? 0,

    }));

  }



  private async buildPostHogAnalyticsStats(period: AdminStatsPeriod): Promise<AdminStatsDto> {

    const periodDays = parsePeriodDays(period);



    const [currentTrends, priorTrends, postHogAllTimeSteps, postHogPeriodSteps] = await Promise.all([

      this.fetchDailyTrends(periodDays),

      this.fetchDailyTrends(periodDays, periodDays),

      this.fetchActivationFunnel(period, 'all_time'),

      this.fetchActivationFunnel(period, 'period'),

    ]);



    const signups = currentTrends.get('signups') ?? fillDailySeries([], periodDays);

    const subscriptions = currentTrends.get('subscriptions') ?? fillDailySeries([], periodDays);

    const checkoutStarted =

      currentTrends.get('checkoutStarted') ?? fillDailySeries([], periodDays);

    const journals = currentTrends.get('journals') ?? fillDailySeries([], periodDays);

    const trades = currentTrends.get('trades') ?? fillDailySeries([], periodDays);

    const communityJoins = currentTrends.get('communityJoins') ?? fillDailySeries([], periodDays);

    const firstTrades = this.mergeFirstTradeSeries(currentTrends, periodDays);



    const priorSignups = priorTrends.get('signups') ?? fillDailySeries([], periodDays);

    const priorSubscriptions = priorTrends.get('subscriptions') ?? fillDailySeries([], periodDays);

    const priorJournals = priorTrends.get('journals') ?? fillDailySeries([], periodDays);

    const priorTrades = priorTrends.get('trades') ?? fillDailySeries([], periodDays);



    const newUsers = sumSeriesCounts(signups);

    const newSubscriptions = sumSeriesCounts(subscriptions);

    const emptyCancellationSeries = fillDailySeries([], periodDays);

    const emptyRevenueSeries = fillDailySeries([], periodDays).map(({ date }) => ({

      date,

      amount: 0,

    }));



    const activationTrend = buildWeeklyActivationTrend(

      periodDays,

      signups,

      journals,

      firstTrades,

      communityJoins,

      subscriptions,

    );



    const series = mergeDailyMetricsSeries(

      periodDays,

      signups,

      subscriptions,

      emptyCancellationSeries,

      trades,

      journals,

      communityJoins,

      emptyRevenueSeries,

    );



    return {

      period,

      posthogConfigured: true,

      posthogFunnelError: !postHogAllTimeSteps,

      users: {

        total: newUsers,

        newInPeriod: newUsers,

        last24h: sumSeriesCounts(signups.slice(-1)),

        last7d: sumSeriesCounts(signups.slice(-7)),

        last30d: sumSeriesCounts(signups.slice(-30)),

        growth: await this.fetchSignupsForGrowth(),

        series: signups,

      },

      revenue: {

        total: 0,

        last24h: 0,

        last7d: 0,

        last30d: 0,

        growth: { daily: 0, weekly: 0, monthly: 0 },

        series: emptyRevenueSeries,

      },

      subscriptions: {

        active: 0,

        canceled: 0,

        newActive: newSubscriptions,

        newCanceled: 0,

        growth: await this.fetchSubscriptionsForGrowth(),

        series: subscriptions,

        cancellationSeries: emptyCancellationSeries,

        checkoutSeries: checkoutStarted,

      },

      activation: {

        source: 'posthog',

        steps: postHogAllTimeSteps ?? [],

        periodSteps: postHogPeriodSteps ?? undefined,

      },

      series,

      activationTrend,

      comparisons: {

        users: computeGrowthPercent(newUsers, sumSeriesCounts(priorSignups)),

        subscriptions: computeGrowthPercent(

          newSubscriptions,

          sumSeriesCounts(priorSubscriptions),

        ),

        revenue: 0,

        cancellations: 0,

        trades: computeGrowthPercent(sumSeriesCounts(trades), sumSeriesCounts(priorTrades)),

        journals: computeGrowthPercent(sumSeriesCounts(journals), sumSeriesCounts(priorJournals)),

      },

      revenueSource: 'estimate',

    };

  }



  private buildEmptyAnalyticsStats(

    period: AdminStatsPeriod,

    posthogError = false,

  ): AdminStatsDto {

    const zeroGrowth = { daily: 0, weekly: 0, monthly: 0 };



    return {

      period,

      posthogConfigured: this.isConfigured(),

      posthogFunnelError: posthogError,

      users: {

        total: 0,

        newInPeriod: 0,

        last24h: 0,

        last7d: 0,

        last30d: 0,

        growth: zeroGrowth,

        series: [],

      },

      revenue: {

        total: 0,

        last24h: 0,

        last7d: 0,

        last30d: 0,

        growth: zeroGrowth,

        series: [],

      },

      subscriptions: {

        active: 0,

        canceled: 0,

        newActive: 0,

        newCanceled: 0,

        growth: zeroGrowth,

        series: [],

        cancellationSeries: [],

        checkoutSeries: [],

      },

      activation: {

        source: 'posthog',

        steps: [],

      },

      revenueSource: 'estimate',

    };

  }



  private async fetchDailyTrends(

    periodDays: number,

    offsetDays = 0,

  ): Promise<DailySeriesMap> {

    const dateRange =

      offsetDays > 0

        ? {

            date_from: `-${periodDays + offsetDays}d`,

            date_to: `-${offsetDays}d`,

          }

        : { date_from: `-${periodDays}d` };



    const response = await this.queryTrends(dateRange, 'day');

    return this.mapTrendResults(response, periodDays);

  }



  private async fetchSignupsForGrowth(): Promise<{

    daily: number;

    weekly: number;

    monthly: number;

  }> {

    const [last60d, last1d, last2d, last14d, last60to30] = await Promise.all([

      this.fetchDailyTrends(60),

      this.fetchDailyTrends(1),

      this.fetchDailyTrends(2),

      this.fetchDailyTrends(14),

      this.fetchDailyTrends(30, 30),

    ]);



    const signups60 = last60d.get('signups') ?? [];

    const signups1 = last1d.get('signups') ?? [];

    const signups2 = last2d.get('signups') ?? [];

    const signups14 = last14d.get('signups') ?? [];

    const signupsPrior30 = last60to30.get('signups') ?? [];



    return {

      daily: computeGrowthPercent(

        sumSeriesCounts(signups1),

        sumSeriesCounts(signups2.slice(0, 1)),

      ),

      weekly: computeGrowthPercent(

        sumSeriesCounts(signups14.slice(-7)),

        sumSeriesCounts(signups14.slice(-14, -7)),

      ),

      monthly: computeGrowthPercent(

        sumSeriesCounts(signups60.slice(-30)),

        sumSeriesCounts(signupsPrior30),

      ),

    };

  }



  private async fetchSubscriptionsForGrowth(): Promise<{

    daily: number;

    weekly: number;

    monthly: number;

  }> {

    const [last60d, last1d, last2d, last14d, last60to30] = await Promise.all([

      this.fetchDailyTrends(60),

      this.fetchDailyTrends(1),

      this.fetchDailyTrends(2),

      this.fetchDailyTrends(14),

      this.fetchDailyTrends(30, 30),

    ]);



    const subs60 = last60d.get('subscriptions') ?? [];

    const subs1 = last1d.get('subscriptions') ?? [];

    const subs2 = last2d.get('subscriptions') ?? [];

    const subs14 = last14d.get('subscriptions') ?? [];

    const subsPrior30 = last60to30.get('subscriptions') ?? [];



    return {

      daily: computeGrowthPercent(sumSeriesCounts(subs1), sumSeriesCounts(subs2.slice(0, 1))),

      weekly: computeGrowthPercent(

        sumSeriesCounts(subs14.slice(-7)),

        sumSeriesCounts(subs14.slice(-14, -7)),

      ),

      monthly: computeGrowthPercent(

        sumSeriesCounts(subs60.slice(-30)),

        sumSeriesCounts(subsPrior30),

      ),

    };

  }

}


