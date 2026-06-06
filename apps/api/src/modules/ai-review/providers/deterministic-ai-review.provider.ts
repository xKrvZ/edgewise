import { Injectable } from '@nestjs/common';
import { AnalyticsDao } from '@/modules/analytics/daos/analytics.dao';
import { TradeDao } from '@/modules/trade/daos/trade.dao';
import { toNumber } from '@/database/utils/numeric.util';
import {
  aggregate,
  bucketDate,
  dayKey,
  groupBy,
  type AnalyticsMistakeRow,
  type AnalyticsTrade,
} from '@/modules/analytics/analytics.util';
import type { AiReviewDto, AiReviewSetupDto, TradeAiReviewDto } from '../dtos/ai-review.dto';
import type {
  AiReviewProvider,
  AiReviewRange,
} from '../interfaces/ai-review-provider.interface';

const OVERTRADING_DAILY_THRESHOLD = 4;
const LOW_EXECUTION_RATING = 2;
const MIN_SAMPLE_FOR_TIME_INSIGHT = 3;

interface SetupAgg {
  setupId: string;
  label: string;
  trades: number;
  netPnl: number;
  winRate: number;
}

interface MistakeAgg {
  mistakeId: string;
  label: string;
  count: number;
  pnlImpact: number;
}

/**
 * Deterministic AI review generator. It performs NO external calls — every
 * field is derived from the user's closed trades via the shared analytics
 * computations, so output is stable for a given dataset. An OpenAI-backed
 * implementation can later be bound to the same AI_REVIEW_PROVIDER token
 * without changing the controller/service contract.
 */
@Injectable()
export class DeterministicAiReviewProvider implements AiReviewProvider {
  constructor(
    private readonly analyticsDao: AnalyticsDao,
    private readonly tradeDao: TradeDao,
  ) {}

  async generateReview(
    userId: string,
    range: AiReviewRange,
  ): Promise<AiReviewDto> {
    const filters = {
      accountId: range.accountId,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
    };

    const [trades, mistakeRows] = await Promise.all([
      this.analyticsDao.findClosedTrades(userId, filters),
      this.analyticsDao.findClosedTradeMistakes(userId, filters),
    ]);

    const generatedAt = new Date().toISOString();

    if (trades.length === 0) {
      return {
        generatedAt,
        summary:
          'No closed trades in the selected period yet. Log some trades to unlock your performance review.',
        biggestWeakness:
          'Not enough data to identify a weakness — start journaling your trades.',
        bestSetup: null,
        worstSetup: null,
        overtradingWarnings: [],
        timeOfDayInsights: [],
        ruleBreakingPatterns: [],
        suggestedFocus: [
          'Record your trades consistently so the review can surface patterns.',
        ],
      };
    }

    const setups = this.aggregateSetups(trades);
    const mistakes = this.aggregateMistakes(mistakeRows);
    const bestSetup = this.bestSetup(setups);
    const worstSetup = this.worstSetup(setups);

    return {
      generatedAt,
      summary: this.buildSummary(trades),
      biggestWeakness: this.buildBiggestWeakness(mistakes, worstSetup),
      bestSetup,
      worstSetup,
      overtradingWarnings: this.buildOvertradingWarnings(trades),
      timeOfDayInsights: this.buildTimeOfDayInsights(trades),
      ruleBreakingPatterns: this.buildRuleBreakingPatterns(trades, mistakeRows),
      suggestedFocus: this.buildSuggestedFocus(
        mistakes,
        worstSetup,
        bestSetup,
        trades,
      ),
    };
  }

  async generateTradeReview(
    userId: string,
    tradeId: string,
  ): Promise<TradeAiReviewDto | null> {
    const context = await this.tradeDao.findReviewContext(tradeId, userId);
    if (!context) {
      return null;
    }

    const { trade, setupName, sessionName, mistakeNames } = context;
    const generatedAt = new Date().toISOString();
    const pnl = toNumber(trade.pnl) ?? 0;
    const rMultiple = toNumber(trade.rMultiple);
    const stopLoss = toNumber(trade.stopLoss);
    const isOpen = trade.status === 'open' || trade.exitTime === null;

    return {
      generatedAt,
      summary: this.buildTradeSummary(trade.symbol, trade.direction, pnl, rMultiple, isOpen),
      insights: this.buildTradeInsights(
        trade,
        setupName,
        sessionName,
        stopLoss,
        isOpen,
      ),
      mistakesFlagged: mistakeNames,
      suggestions: this.buildTradeSuggestions(
        trade,
        mistakeNames,
        stopLoss,
        pnl,
        rMultiple,
        setupName,
      ),
    };
  }

  // ==================== Aggregations ====================

  private aggregateSetups(trades: AnalyticsTrade[]): SetupAgg[] {
    const groups = groupBy(
      trades.filter((t) => t.setupId !== null),
      (t) => t.setupId as string,
    );
    const result: SetupAgg[] = [];
    for (const [setupId, items] of groups) {
      const core = aggregate(items.map((t) => ({ pnl: t.pnl, rMultiple: t.rMultiple })));
      result.push({
        setupId,
        label: items[0].setupName ?? 'Unknown setup',
        trades: core.totalTrades,
        netPnl: round2(core.netPnl),
        winRate: round4(core.winRate),
      });
    }
    return result;
  }

  private aggregateMistakes(rows: AnalyticsMistakeRow[]): MistakeAgg[] {
    const groups = groupBy(rows, (r) => r.mistakeId);
    const result: MistakeAgg[] = [];
    for (const [mistakeId, items] of groups) {
      result.push({
        mistakeId,
        label: items[0].mistakeName,
        count: items.length,
        pnlImpact: round2(items.reduce((a, r) => a + r.pnl, 0)),
      });
    }
    return result;
  }

  private bestSetup(setups: SetupAgg[]): AiReviewSetupDto | null {
    if (setups.length === 0) return null;
    const best = setups.reduce((a, b) => (b.netPnl > a.netPnl ? b : a));
    return { label: best.label, netPnl: best.netPnl, winRate: best.winRate };
  }

  private worstSetup(setups: SetupAgg[]): AiReviewSetupDto | null {
    if (setups.length === 0) return null;
    const worst = setups.reduce((a, b) => (b.netPnl < a.netPnl ? b : a));
    return { label: worst.label, netPnl: worst.netPnl, winRate: worst.winRate };
  }

  // ==================== Narrative builders ====================

  private buildSummary(trades: AnalyticsTrade[]): string {
    const core = aggregate(trades.map((t) => ({ pnl: t.pnl, rMultiple: t.rMultiple })));
    const pf =
      core.profitFactor === null
        ? 'no losing trades'
        : `a ${core.profitFactor.toFixed(2)} profit factor`;
    const direction = core.netPnl >= 0 ? 'netted' : 'lost';
    return `Over ${core.totalTrades} closed trades you ${direction} ${fmtMoney(
      Math.abs(core.netPnl),
    )} with a ${fmtPct(core.winRate)} win rate and ${pf}.`;
  }

  private buildBiggestWeakness(
    mistakes: MistakeAgg[],
    worstSetup: AiReviewSetupDto | null,
  ): string {
    const costliestMistake = mistakes
      .filter((m) => m.pnlImpact < 0)
      .sort((a, b) => a.pnlImpact - b.pnlImpact)[0];

    if (costliestMistake) {
      return `"${costliestMistake.label}" is your costliest pattern — it shows up on ${
        costliestMistake.count
      } trade(s) for ${fmtMoney(costliestMistake.pnlImpact)} of impact.`;
    }

    if (worstSetup && worstSetup.netPnl < 0) {
      return `Your "${worstSetup.label}" setup is a net drag at ${fmtMoney(
        worstSetup.netPnl,
      )} (${fmtPct(worstSetup.winRate)} win rate).`;
    }

    return 'No single dominant weakness stands out — focus on consistency and position sizing.';
  }

  private buildOvertradingWarnings(trades: AnalyticsTrade[]): string[] {
    const byDay = groupBy(trades, (t) => dayKey(bucketDate(t)));
    const warnings: string[] = [];

    const busyDays = [...byDay.entries()]
      .map(([date, items]) => ({
        date,
        count: items.length,
        pnl: round2(items.reduce((a, t) => a + t.pnl, 0)),
      }))
      .filter((d) => d.count >= OVERTRADING_DAILY_THRESHOLD)
      .sort((a, b) => b.count - a.count);

    for (const day of busyDays.slice(0, 3)) {
      const outcome =
        day.pnl < 0
          ? `and it was a losing day (${fmtMoney(day.pnl)})`
          : `(${fmtMoney(day.pnl)})`;
      warnings.push(
        `On ${day.date} you placed ${day.count} trades ${outcome} — watch for overtrading on high-frequency days.`,
      );
    }

    return warnings;
  }

  private buildTimeOfDayInsights(trades: AnalyticsTrade[]): string[] {
    const byHour = groupBy(trades, (t) =>
      String(t.entryTime.getUTCHours()).padStart(2, '0'),
    );
    const hours = [...byHour.entries()]
      .map(([hour, items]) => {
        const core = aggregate(
          items.map((t) => ({ pnl: t.pnl, rMultiple: t.rMultiple })),
        );
        return {
          hour,
          trades: core.totalTrades,
          netPnl: round2(core.netPnl),
          winRate: core.winRate,
        };
      })
      .filter((h) => h.trades >= MIN_SAMPLE_FOR_TIME_INSIGHT);

    if (hours.length === 0) {
      return [];
    }

    const insights: string[] = [];
    const best = hours.reduce((a, b) => (b.netPnl > a.netPnl ? b : a));
    const worst = hours.reduce((a, b) => (b.netPnl < a.netPnl ? b : a));

    insights.push(
      `Your strongest hour (UTC) is ${best.hour}:00 — ${fmtMoney(
        best.netPnl,
      )} across ${best.trades} trades (${fmtPct(best.winRate)} win rate).`,
    );

    if (worst.hour !== best.hour && worst.netPnl < best.netPnl) {
      insights.push(
        `Your weakest hour (UTC) is ${worst.hour}:00 — ${fmtMoney(
          worst.netPnl,
        )} across ${worst.trades} trades (${fmtPct(worst.winRate)} win rate).`,
      );
    }

    return insights;
  }

  private buildRuleBreakingPatterns(
    trades: AnalyticsTrade[],
    mistakeRows: AnalyticsMistakeRow[],
  ): string[] {
    const patterns: string[] = [];

    const noStop = trades.filter((t) => t.stopLoss === null).length;
    if (noStop > 0) {
      patterns.push(
        `${noStop} trade(s) were taken without a defined stop loss — predefine risk on every entry.`,
      );
    }

    const lowExecution = trades.filter(
      (t) => t.executionRating !== null && t.executionRating <= LOW_EXECUTION_RATING,
    ).length;
    if (lowExecution > 0) {
      patterns.push(
        `${lowExecution} trade(s) were self-rated ${LOW_EXECUTION_RATING}/5 or lower on execution — review your process on these.`,
      );
    }

    const distinctMistakeTypes = new Set(mistakeRows.map((r) => r.mistakeId));
    const flaggedLinks = mistakeRows.length;
    if (flaggedLinks > 0) {
      patterns.push(
        `${flaggedLinks} mistake tag(s) were logged across your trades, spanning ${distinctMistakeTypes.size} distinct mistake type(s).`,
      );
    }

    return patterns;
  }

  private buildSuggestedFocus(
    mistakes: MistakeAgg[],
    worstSetup: AiReviewSetupDto | null,
    bestSetup: AiReviewSetupDto | null,
    trades: AnalyticsTrade[],
  ): string[] {
    const focus: string[] = [];

    const costliestMistake = mistakes
      .filter((m) => m.pnlImpact < 0)
      .sort((a, b) => a.pnlImpact - b.pnlImpact)[0];
    if (costliestMistake) {
      focus.push(
        `Eliminate "${costliestMistake.label}" — it is your most expensive recurring mistake.`,
      );
    }

    if (worstSetup && worstSetup.netPnl < 0) {
      focus.push(
        `Cut or refine the "${worstSetup.label}" setup until it proves an edge.`,
      );
    }

    if (bestSetup && bestSetup.netPnl > 0) {
      focus.push(
        `Lean into "${bestSetup.label}", your highest-performing setup, when it sets up cleanly.`,
      );
    }

    const lowExecution = trades.filter(
      (t) => t.executionRating !== null && t.executionRating <= LOW_EXECUTION_RATING,
    ).length;
    if (lowExecution > 0) {
      focus.push(
        'Raise execution quality — too many trades are rated poorly on follow-through.',
      );
    }

    if (focus.length === 0) {
      focus.push(
        'Maintain discipline: keep risk consistent and continue journaling every trade.',
      );
    }

    return focus;
  }

  private buildTradeSummary(
    symbol: string,
    direction: string,
    pnl: number,
    rMultiple: number | null,
    isOpen: boolean,
  ): string {
    const side = direction.toLowerCase();
    const rText =
      rMultiple === null ? 'no R recorded' : `${rMultiple >= 0 ? '+' : ''}${rMultiple.toFixed(2)}R`;
    if (isOpen) {
      return `Your open ${side} ${symbol} trade is still active — review execution and risk while the position is live.`;
    }
    const outcome = pnl >= 0 ? 'closed green' : 'closed red';
    return `Your ${side} ${symbol} trade ${outcome} for ${fmtMoney(pnl)} at ${rText}.`;
  }

  private buildTradeInsights(
    trade: {
      executionRating: number | null;
      emotion: string | null;
      notes: string | null;
      entryTime: Date;
      exitTime: Date | null;
    },
    setupName: string | null,
    sessionName: string | null,
    stopLoss: number | null,
    isOpen: boolean,
  ): string[] {
    const insights: string[] = [];

    if (setupName) {
      insights.push(`Setup used: ${setupName}.`);
    }
    if (sessionName) {
      insights.push(`Logged under session "${sessionName}".`);
    }
    if (stopLoss === null) {
      insights.push('No stop loss was defined on this trade.');
    }
    if (trade.executionRating !== null) {
      insights.push(`Self-rated execution: ${trade.executionRating}/5.`);
    }
    if (trade.emotion) {
      insights.push(`Emotional state noted: ${trade.emotion}.`);
    }
    if (!isOpen && trade.exitTime) {
      const holdMinutes = Math.round(
        (trade.exitTime.getTime() - trade.entryTime.getTime()) / 60_000,
      );
      if (holdMinutes > 0) {
        insights.push(`Held for about ${holdMinutes} minute(s).`);
      }
    }
    if (!trade.notes?.trim()) {
      insights.push('No trade notes were recorded — journaling helps spot patterns.');
    }

    if (insights.length === 0) {
      insights.push('Limited metadata on this trade — add setup, rating, and notes for richer reviews.');
    }

    return insights;
  }

  private buildTradeSuggestions(
    trade: { executionRating: number | null },
    mistakeNames: string[],
    stopLoss: number | null,
    pnl: number,
    rMultiple: number | null,
    setupName: string | null,
  ): string[] {
    const suggestions: string[] = [];

    if (stopLoss === null) {
      suggestions.push('Define a stop loss before entry on every trade.');
    }
    if (
      trade.executionRating !== null &&
      trade.executionRating <= LOW_EXECUTION_RATING
    ) {
      suggestions.push(
        'Review what broke down in execution — was the plan followed from entry to exit?',
      );
    }
    for (const mistake of mistakeNames) {
      suggestions.push(`Address "${mistake}" — it was flagged on this trade.`);
    }
    if (pnl < 0 && setupName) {
      suggestions.push(
        `Revisit whether "${setupName}" met your criteria before you took this loss.`,
      );
    }
    if (rMultiple !== null && rMultiple < -1) {
      suggestions.push(
        'Loss exceeded 1R — check position sizing and whether the stop was honored.',
      );
    }
    if (suggestions.length === 0) {
      suggestions.push('Solid process on this trade — replicate what worked on the next setup.');
    }

    return suggestions;
  }
}

// ==================== Formatting helpers ====================

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function fmtMoney(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtPct(ratio0to1: number): string {
  return `${Math.round(ratio0to1 * 100)}%`;
}
