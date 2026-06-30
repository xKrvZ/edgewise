import { Injectable } from '@nestjs/common';
import { AnalyticsCacheService } from '../cache/analytics-cache.service';
import { AnalyticsDao, type AnalyticsTradeFilters } from '../daos/analytics.dao';
import {
  AccountBalancePointDto,
  AnalyticsDashboardDto,
  AnalyticsOverviewDto,
  CalendarDayDto,
  DrawdownPointDto,
  EquityPointDto,
  GroupStatDto,
  PnlOverTimePointDto,
  RDistributionBucketDto,
  TradeDurationPointDto,
} from '../dtos/analytics.dto';
import {
  buildGroupStat,
  bucketDate,
  DAY_OF_WEEK_ORDER,
  dayKey,
  dayOfWeekName,
  groupBy,
  toStat,
  type GroupStat,
} from '../analytics.util';
import { AnalyticsComputationService } from './analytics-computation.service';

/**
 * Deterministic reporting/analytics. All metrics are computed over CLOSED
 * trades fetched via {@link AnalyticsDao}. Empty inputs yield zeroed/empty
 * results rather than errors.
 *
 * Reads are cached per (user, version, endpoint, filters) via
 * {@link AnalyticsCacheService}; trade writes bump the user's version to
 * invalidate. The pure `compute*` helpers derive each metric from an
 * already-fetched dataset so the consolidated {@link getDashboard} can serve a
 * full dashboard from a single trade fetch.
 */
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly analyticsDao: AnalyticsDao,
    private readonly cache: AnalyticsCacheService,
    private readonly computation: AnalyticsComputationService,
  ) {}

  private toFilters(query: AnalyticsTradeFilters): AnalyticsTradeFilters {
    return {
      accountId: query.accountId,
      accountIds: query.accountIds,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      marketType: query.marketType,
      direction: query.direction,
    };
  }

  /** Stable cache-key suffix from the endpoint name + normalized filters. */
  private suffix(prefix: string, f: AnalyticsTradeFilters): string {
    const accountKey =
      f.accountIds && f.accountIds.length > 0
        ? f.accountIds.slice().sort().join(',')
        : (f.accountId ?? '_');
    return [
      prefix,
      accountKey,
      f.dateFrom ?? '_',
      f.dateTo ?? '_',
      f.marketType ?? '_',
      f.direction ?? '_',
    ].join(':');
  }

  // ==================== Consolidated dashboard ====================

  /**
   * Single payload powering the dashboard. Fetches the closed-trade set (plus
   * mistakes and starting balance) ONCE and derives every widget from it,
   * replacing what used to be 7 separate endpoint round-trips.
   */
  async getDashboard(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<AnalyticsDashboardDto> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('dashboard', filters),
      async () => {
        const [trades, mistakeRows, startingBalance] = await Promise.all([
            this.analyticsDao.findClosedTrades(userId, filters),
            this.analyticsDao.findClosedTradeMistakes(userId, filters),
            this.analyticsDao.sumStartingBalance(userId, filters.accountId, filters.accountIds),
          ]);

        return {
          overview: this.computation.computeOverview(trades, mistakeRows),
          equityCurve: this.computation.computeEquityCurve(trades),
          pnlOverTime: this.computation.computePnlOverTime(trades),
          drawdown: this.computation.computeDrawdown(trades),
          accountBalance: this.computation.computeAccountBalance(
            trades,
            startingBalance,
          ),
          tradeDuration: this.computation.computeTradeDuration(trades),
          calendar: this.computation.computeCalendar(trades),
        };
      },
    );
  }

  // ==================== Individual endpoints ====================

  async getOverview(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<AnalyticsOverviewDto> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('overview', filters),
      async () => {
        const [trades, mistakeRows] = await Promise.all([
          this.analyticsDao.findClosedTrades(userId, filters),
          this.analyticsDao.findClosedTradeMistakes(userId, filters),
        ]);
        return this.computation.computeOverview(trades, mistakeRows);
      },
    );
  }

  async getDrawdown(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<DrawdownPointDto[]> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('drawdown', filters),
      async () => {
        const trades = await this.analyticsDao.findClosedTrades(userId, filters);
        return this.computation.computeDrawdown(trades);
      },
    );
  }

  async getAccountBalance(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<AccountBalancePointDto[]> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('account-balance', filters),
      async () => {
        const [trades, startingBalance] = await Promise.all([
          this.analyticsDao.findClosedTrades(userId, filters),
          this.analyticsDao.sumStartingBalance(userId, filters.accountId),
        ]);
        return this.computation.computeAccountBalance(trades, startingBalance);
      },
    );
  }

  async getTradeDuration(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<TradeDurationPointDto[]> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('trade-duration', filters),
      async () => {
        const trades = await this.analyticsDao.findClosedTrades(userId, filters);
        return this.computation.computeTradeDuration(trades);
      },
    );
  }

  async getEquityCurve(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<EquityPointDto[]> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('equity-curve', filters),
      async () => {
        const trades = await this.analyticsDao.findClosedTrades(userId, filters);
        return this.computation.computeEquityCurve(trades);
      },
    );
  }

  async getPnlOverTime(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<PnlOverTimePointDto[]> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('pnl-over-time', filters),
      async () => {
        const trades = await this.analyticsDao.findClosedTrades(userId, filters);
        return this.computation.computePnlOverTime(trades);
      },
    );
  }

  async getRDistribution(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<RDistributionBucketDto[]> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('r-distribution', filters),
      async () => {
        const trades = await this.analyticsDao.findClosedTrades(userId, filters);
        return this.computation.computeRDistribution(trades);
      },
    );
  }

  async getBySetup(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<GroupStatDto[]> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('by-setup', filters),
      async () => {
        const trades = await this.analyticsDao.findClosedTrades(userId, filters);
        const groups = groupBy(trades, (t) => t.setupId ?? 'none');
        const stats: GroupStat[] = [];
        for (const [key, items] of groups) {
          const label = items[0].setupName ?? 'No setup';
          stats.push(buildGroupStat(key, label, items.map(toStat)));
        }
        return this.sortByNetPnlDesc(stats);
      },
    );
  }

  async getBySymbol(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<GroupStatDto[]> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('by-symbol', filters),
      async () => {
        const trades = await this.analyticsDao.findClosedTrades(userId, filters);
        const groups = groupBy(trades, (t) => t.symbol);
        const stats: GroupStat[] = [];
        for (const [key, items] of groups) {
          stats.push(buildGroupStat(key, key, items.map(toStat)));
        }
        return this.sortByNetPnlDesc(stats);
      },
    );
  }

  async getBySession(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<GroupStatDto[]> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('by-session', filters),
      async () => {
        const trades = await this.analyticsDao.findClosedTrades(userId, filters);
        const groups = groupBy(trades, (t) => t.sessionId ?? 'none');
        const stats: GroupStat[] = [];
        for (const [key, items] of groups) {
          const label = items[0].sessionName ?? 'No session';
          stats.push(buildGroupStat(key, label, items.map(toStat)));
        }
        return this.sortByNetPnlDesc(stats);
      },
    );
  }

  async getByAccount(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<GroupStatDto[]> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('by-account', filters),
      async () => {
        const trades = await this.analyticsDao.findClosedTrades(userId, filters);
        const groups = groupBy(trades, (t) => t.accountId);
        const stats: GroupStat[] = [];
        for (const [key, items] of groups) {
          const label = items[0].accountName ?? key;
          stats.push(buildGroupStat(key, label, items.map(toStat)));
        }
        return this.sortByNetPnlDesc(stats);
      },
    );
  }

  async getByDirection(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<GroupStatDto[]> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('by-direction', filters),
      async () => {
        const trades = await this.analyticsDao.findClosedTrades(userId, filters);
        const groups = groupBy(trades, (t) => t.direction);
        const stats: GroupStat[] = [];
        for (const [key, items] of groups) {
          const label = key.charAt(0).toUpperCase() + key.slice(1);
          stats.push(buildGroupStat(key, label, items.map(toStat)));
        }
        return this.sortByNetPnlDesc(stats);
      },
    );
  }

  async getByDayOfWeek(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<GroupStatDto[]> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('by-day-of-week', filters),
      async () => {
        const trades = await this.analyticsDao.findClosedTrades(userId, filters);
        const groups = groupBy(trades, (t) => dayOfWeekName(bucketDate(t)));
        return DAY_OF_WEEK_ORDER.map((day) =>
          buildGroupStat(day, day, (groups.get(day) ?? []).map(toStat)),
        );
      },
    );
  }

  async getByTimeOfDay(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<GroupStatDto[]> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('by-time-of-day', filters),
      async () => {
        const trades = await this.analyticsDao.findClosedTrades(userId, filters);
        const groups = groupBy(trades, (t) =>
          String(t.entryTime.getUTCHours()).padStart(2, '0'),
        );
        const stats: GroupStat[] = [];
        for (const [key, items] of groups) {
          stats.push(buildGroupStat(key, `${key}:00`, items.map(toStat)));
        }
        return stats.sort((a, b) => Number(a.key) - Number(b.key));
      },
    );
  }

  async getByMistake(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<GroupStatDto[]> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('by-mistake', filters),
      async () => {
        const mistakeRows = await this.analyticsDao.findClosedTradeMistakes(
          userId,
          filters,
        );
        const groups = groupBy(mistakeRows, (r) => r.mistakeId);
        const stats: GroupStat[] = [];
        for (const [key, items] of groups) {
          stats.push(
            buildGroupStat(key, items[0].mistakeName, items.map(toStat)),
          );
        }
        // Most damaging mistakes first.
        return stats.sort((a, b) => a.netPnl - b.netPnl);
      },
    );
  }

  async getCalendar(
    userId: string,
    query: AnalyticsTradeFilters,
  ): Promise<CalendarDayDto[]> {
    const filters = this.toFilters(query);
    return this.cache.resolve(
      userId,
      this.suffix('calendar', filters),
      async () => {
        const trades = await this.analyticsDao.findClosedTrades(userId, filters);
        return this.computation.computeCalendar(trades);
      },
    );
  }

  // ==================== Helpers ====================

  private sortByNetPnlDesc(stats: GroupStat[]): GroupStat[] {
    return stats.sort((a, b) => b.netPnl - a.netPnl);
  }
}
