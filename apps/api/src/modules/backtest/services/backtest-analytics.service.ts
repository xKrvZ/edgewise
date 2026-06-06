import { Injectable, NotFoundException } from '@nestjs/common';
import type { Selectable } from 'kysely';
import type { Backtest, BacktestTrade } from '@/database/types/db';
import { toNumber, toRequiredNumber } from '@/database/utils/numeric.util';
import { AnalyticsCacheService } from '@/modules/analytics/cache/analytics-cache.service';
import { AnalyticsComputationService } from '@/modules/analytics/services/analytics-computation.service';
import type { AnalyticsTrade } from '@/modules/analytics/analytics.util';
import { BacktestDao } from '../daos/backtest.dao';
import { BacktestTradeDao } from '../daos/backtest-trade.dao';
import { BacktestAnalyticsDashboardDto } from '../dtos/backtest-analytics.dto';

@Injectable()
export class BacktestAnalyticsService {
  constructor(
    private readonly backtestDao: BacktestDao,
    private readonly backtestTradeDao: BacktestTradeDao,
    private readonly computation: AnalyticsComputationService,
    private readonly cache: AnalyticsCacheService,
  ) {}

  async getDashboard(
    backtestId: string,
    userId: string,
  ): Promise<BacktestAnalyticsDashboardDto> {
    const backtest = await this.backtestDao.findByIdForUser(backtestId, userId);
    if (!backtest) {
      throw new NotFoundException(`Backtest ${backtestId} not found`);
    }

    return this.cache.resolve(
      userId,
      `backtest:${backtestId}:analytics`,
      async () => {
        const rows = await this.backtestTradeDao.findByBacktest(backtestId);
        const trades = this.toClosedAnalyticsTrades(rows, backtest);

        return {
          overview: this.computation.computeOverview(trades),
          equityCurve: this.computation.computeEquityCurve(trades),
          pnlOverTime: this.computation.computePnlOverTime(trades),
          drawdown: this.computation.computeDrawdown(trades),
          tradeDuration: this.computation.computeTradeDuration(trades),
          calendar: this.computation.computeCalendar(trades),
          rDistribution: this.computation.computeRDistribution(trades),
        };
      },
    );
  }

  async invalidate(backtestId: string, userId: string): Promise<void> {
    await this.cache.invalidateSuffix(userId, `backtest:${backtestId}:analytics`);
  }

  private toClosedAnalyticsTrades(
    rows: Selectable<BacktestTrade>[],
    backtest: Selectable<Backtest>,
  ): AnalyticsTrade[] {
    const closed: AnalyticsTrade[] = [];

    for (const row of rows) {
      if (!row.exitTime) {
        continue;
      }

      const pnl = this.resolvePnl(row);
      if (pnl === null) {
        continue;
      }

      closed.push({
        id: row.id,
        symbol: row.symbol,
        direction: row.direction,
        marketType: backtest.marketType,
        accountId: backtest.id,
        accountName: backtest.name,
        setupId: null,
        setupName: null,
        sessionId: null,
        sessionName: null,
        entryTime: row.entryTime,
        exitTime: row.exitTime,
        pnl,
        fees: toRequiredNumber(row.fees),
        rMultiple: toNumber(row.rMultiple),
        stopLoss: toNumber(row.stopLoss),
        executionRating: null,
      });
    }

    return closed;
  }

  private resolvePnl(row: Selectable<BacktestTrade>): number | null {
    const stored = toNumber(row.pnl);
    if (stored !== null) {
      return stored;
    }

    const exitPrice = toNumber(row.exitPrice);
    if (exitPrice === null) {
      return null;
    }

    const entryPrice = toRequiredNumber(row.entryPrice);
    const quantity = toRequiredNumber(row.quantity);
    const fees = toRequiredNumber(row.fees);
    const dir = row.direction === 'long' ? 1 : -1;
    return (exitPrice - entryPrice) * dir * quantity - fees;
  }
}
