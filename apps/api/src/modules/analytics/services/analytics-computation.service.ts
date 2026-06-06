import { Injectable } from '@nestjs/common';
import {
  AccountBalancePointDto,
  AnalyticsOverviewDto,
  CalendarDayDto,
  DrawdownPointDto,
  EquityPointDto,
  PnlOverTimePointDto,
  RDistributionBucketDto,
  TradeDurationPointDto,
} from '../dtos/analytics.dto';
import {
  aggregate,
  bucketDate,
  dailyPnlSeries,
  dayKey,
  drawdown,
  groupBy,
  money,
  ratio,
  round,
  rBucket,
  R_BUCKETS,
  sharpeRatio,
  toStat,
  computeTraderScore,
  type AnalyticsMistakeRow,
  type AnalyticsTrade,
} from '../analytics.util';

/**
 * Pure metric computations shared by live-trade analytics and backtest analytics.
 * Callers supply already-fetched closed trades; no I/O happens here.
 */
@Injectable()
export class AnalyticsComputationService {
  computeOverview(
    trades: AnalyticsTrade[],
    mistakeRows: AnalyticsMistakeRow[] = [],
    breakevenRange = 0,
  ): AnalyticsOverviewDto {
    const opts = { breakevenRange };
    const core = aggregate(trades.map(toStat), opts);
    const isWin = (pnl: number) =>
      Math.abs(pnl) > breakevenRange && pnl > breakevenRange;
    const isLoss = (pnl: number) =>
      Math.abs(pnl) > breakevenRange && pnl < -breakevenRange;

    const winners = trades.filter((t) => isWin(t.pnl)).map((t) => t.pnl);
    const losers = trades.filter((t) => isLoss(t.pnl)).map((t) => t.pnl);
    const avgWinner =
      winners.length > 0
        ? winners.reduce((a, b) => a + b, 0) / winners.length
        : 0;
    const avgLoser =
      losers.length > 0 ? losers.reduce((a, b) => a + b, 0) / losers.length : 0;
    const largestWin = winners.length > 0 ? Math.max(...winners) : 0;
    const largestLoss = losers.length > 0 ? Math.min(...losers) : 0;

    const avg = (xs: number[]) =>
      xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
    const holdMinutes = (t: AnalyticsTrade) =>
      t.exitTime
        ? (t.exitTime.getTime() - t.entryTime.getTime()) / 60000
        : null;
    const validHold = (m: number | null): m is number =>
      m !== null && Number.isFinite(m) && m >= 0;

    const allHolds = trades.map(holdMinutes).filter(validHold);
    const winHolds = trades
      .filter((t) => isWin(t.pnl))
      .map(holdMinutes)
      .filter(validHold);
    const lossHolds = trades
      .filter((t) => isLoss(t.pnl))
      .map(holdMinutes)
      .filter(validHold);

    const daily = dailyPnlSeries(trades);
    const dailyValues = daily.map((d) => d.pnl);
    const dd = drawdown(daily);
    const recoveryFactor =
      dd.maxDrawdown > 0 ? core.netPnl / dd.maxDrawdown : null;
    const profitableDays = daily.filter((d) => d.pnl > 0).length;
    const sharpe = sharpeRatio(dailyValues);

    const traderScoreResult = computeTraderScore({
      winRate: core.winRate,
      profitFactor: core.profitFactor,
      avgWinner,
      avgLoser,
      netPnl: core.netPnl,
      maxDrawdown: dd.maxDrawdown,
      maxDrawdownPct: dd.maxDrawdownPct,
      dailyPnl: dailyValues,
    });

    return {
      netPnl: money(core.netPnl),
      grossProfit: money(core.grossProfit),
      grossLoss: money(core.grossLoss),
      totalFees: money(core.totalFees),
      totalTrades: core.totalTrades,
      winningTrades: core.winningTrades,
      losingTrades: core.losingTrades,
      breakevenTrades: core.breakevenTrades,
      winRate: ratio(core.winRate),
      profitFactor:
        core.profitFactor === null ? null : ratio(core.profitFactor),
      expectancy: money(core.expectancy),
      avgR: core.avgR === null ? null : Number(core.avgR.toFixed(3)),
      avgWinner: money(avgWinner),
      avgLoser: money(avgLoser),
      largestWin: money(largestWin),
      largestLoss: money(largestLoss),
      avgHoldMinutes: round(avg(allHolds), 1),
      avgWinHoldMinutes: round(avg(winHolds), 1),
      avgLossHoldMinutes: round(avg(lossHolds), 1),
      sharpeRatio: sharpe === null ? null : round(sharpe, 3),
      maxDrawdown: money(dd.maxDrawdown),
      maxDrawdownPct:
        dd.maxDrawdownPct === null ? null : round(dd.maxDrawdownPct, 2),
      recoveryFactor: recoveryFactor === null ? null : round(recoveryFactor, 3),
      traderScore: traderScoreResult.score,
      traderScoreBreakdown: traderScoreResult.breakdown,
      tradingDays: daily.length,
      profitableDays,
      greenDayRate: daily.length > 0 ? ratio(profitableDays / daily.length) : 0,
      bestSetup: this.computeBestSetup(trades),
      worstMistake: this.computeWorstMistake(mistakeRows),
    };
  }

  computeDrawdown(trades: AnalyticsTrade[]): DrawdownPointDto[] {
    const { curve } = drawdown(dailyPnlSeries(trades));
    return curve.map((p) => ({
      date: p.date,
      equity: money(p.equity),
      drawdown: money(p.drawdown),
    }));
  }

  computeAccountBalance(
    trades: AnalyticsTrade[],
    startingBalance: number,
  ): AccountBalancePointDto[] {
    const daily = dailyPnlSeries(trades);
    let cumulative = 0;
    return daily.map((d) => {
      cumulative += d.pnl;
      return { date: d.date, balance: money(startingBalance + cumulative) };
    });
  }

  computeTradeDuration(trades: AnalyticsTrade[]): TradeDurationPointDto[] {
    const points: TradeDurationPointDto[] = [];
    for (const t of trades) {
      if (!t.exitTime) {
        continue;
      }
      const durationMs = t.exitTime.getTime() - t.entryTime.getTime();
      if (!Number.isFinite(durationMs) || durationMs < 0) {
        continue;
      }
      points.push({
        durationMs: Math.round(durationMs),
        pnl: money(t.pnl),
        win: t.pnl > 0,
      });
    }
    return points;
  }

  computeEquityCurve(trades: AnalyticsTrade[]): EquityPointDto[] {
    const daily = dailyPnlSeries(trades);
    let cumulative = 0;
    return daily.map((d) => {
      cumulative += d.pnl;
      return { date: d.date, pnl: money(d.pnl), cumulativePnl: money(cumulative) };
    });
  }

  computePnlOverTime(trades: AnalyticsTrade[]): PnlOverTimePointDto[] {
    return dailyPnlSeries(trades).map((d) => ({
      date: d.date,
      pnl: money(d.pnl),
    }));
  }

  computeRDistribution(trades: AnalyticsTrade[]): RDistributionBucketDto[] {
    const counts = new Map<string, number>();
    for (const bucket of R_BUCKETS) {
      counts.set(bucket, 0);
    }
    for (const t of trades) {
      if (t.rMultiple === null || !Number.isFinite(t.rMultiple)) {
        continue;
      }
      const bucket = rBucket(t.rMultiple);
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    }
    return R_BUCKETS.map((bucket) => ({ bucket, count: counts.get(bucket) ?? 0 }));
  }

  computeCalendar(trades: AnalyticsTrade[]): CalendarDayDto[] {
    const groups = groupBy(trades, (t) => dayKey(bucketDate(t)));
    const days: CalendarDayDto[] = [];
    for (const [date, items] of groups) {
      const core = aggregate(items.map(toStat));
      days.push({
        date,
        pnl: money(core.netPnl),
        trades: core.totalTrades,
        winRate: ratio(core.winRate),
      });
    }
    return days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }

  private computeBestSetup(
    trades: AnalyticsTrade[],
  ): AnalyticsOverviewDto['bestSetup'] {
    const withSetup = trades.filter((t) => t.setupId !== null);
    if (withSetup.length === 0) {
      return null;
    }
    const groups = groupBy(withSetup, (t) => t.setupId as string);
    let best: { playbookId: string; label: string; netPnl: number } | null =
      null;
    for (const [setupId, items] of groups) {
      const netPnl = items.reduce((a, t) => a + t.pnl, 0);
      if (best === null || netPnl > best.netPnl) {
        best = {
          playbookId: setupId,
          label: items[0].setupName ?? 'Unknown setup',
          netPnl,
        };
      }
    }
    return best ? { ...best, netPnl: money(best.netPnl) } : null;
  }

  private computeWorstMistake(
    mistakeRows: AnalyticsMistakeRow[],
  ): AnalyticsOverviewDto['worstMistake'] {
    if (mistakeRows.length === 0) {
      return null;
    }
    const groups = groupBy(mistakeRows, (r) => r.mistakeId);
    let worst: {
      mistakeId: string;
      label: string;
      count: number;
      pnlImpact: number;
    } | null = null;
    for (const [mistakeId, items] of groups) {
      const pnlImpact = items.reduce((a, r) => a + r.pnl, 0);
      if (worst === null || pnlImpact < worst.pnlImpact) {
        worst = {
          mistakeId,
          label: items[0].mistakeName,
          count: items.length,
          pnlImpact,
        };
      }
    }
    return worst ? { ...worst, pnlImpact: money(worst.pnlImpact) } : null;
  }
}
