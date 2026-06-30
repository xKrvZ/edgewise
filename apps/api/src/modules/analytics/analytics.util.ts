/**
 * Pure, deterministic analytics computations shared by the analytics service
 * and the deterministic AI review provider. No I/O happens here — callers pass
 * in the already-fetched (closed) trades and these helpers derive the metrics
 * described by the analytics HTTP contract.
 */

export interface AnalyticsTrade {
  id: string;
  symbol: string;
  direction: string;
  marketType: string;
  accountId: string;
  accountName: string | null;
  setupId: string | null;
  setupName: string | null;
  sessionId: string | null;
  sessionName: string | null;
  entryTime: Date;
  exitTime: Date | null;
  pnl: number;
  fees: number;
  rMultiple: number | null;
  stopLoss: number | null;
  executionRating: number | null;
}

export interface AnalyticsMistakeRow {
  mistakeId: string;
  mistakeName: string;
  pnl: number;
  rMultiple: number | null;
}

export interface StatInput {
  pnl: number;
  fees?: number;
  rMultiple: number | null;
}

export interface CoreStats {
  totalTrades: number;
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  totalFees: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  profitFactor: number | null;
  expectancy: number;
  avgR: number | null;
}

export interface GroupStat {
  key: string;
  label: string;
  trades: number;
  netPnl: number;
  winRate: number;
  profitFactor: number | null;
  avgR: number | null;
  expectancy: number;
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const DAY_OF_WEEK_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const R_BUCKETS = ['<-2', '-2..-1', '-1..0', '0..1', '1..2', '>2'];

export function round(value: number, dp: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** dp;
  return Math.round(value * factor) / factor;
}

const r2 = (n: number) => round(n, 2);
const r4 = (n: number) => round(n, 4);
const r3 = (n: number) => round(n, 3);

export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function bucketDate(t: { exitTime: Date | null; entryTime: Date }): Date {
  return t.exitTime ?? t.entryTime;
}

export function groupBy<T>(items: T[], keyFn: (t: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

function classifyPnl(pnl: number): 'win' | 'loss' | 'breakeven' {
  if (pnl === 0) {
    return 'breakeven';
  }
  return pnl > 0 ? 'win' : 'loss';
}

export function aggregate(trades: StatInput[]): CoreStats {
  const totalTrades = trades.length;
  let netPnl = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let totalFees = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  const rs: number[] = [];

  for (const t of trades) {
    netPnl += t.pnl;
    if ('fees' in t && typeof t.fees === 'number') {
      totalFees += t.fees;
    }
    const outcome = classifyPnl(t.pnl);
    if (outcome === 'win') {
      grossProfit += t.pnl;
      winningTrades += 1;
    } else if (outcome === 'loss') {
      grossLoss += t.pnl;
      losingTrades += 1;
    } else {
      breakevenTrades += 1;
    }
    if (t.rMultiple !== null && Number.isFinite(t.rMultiple)) {
      rs.push(t.rMultiple);
    }
  }

  const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
  const profitFactor =
    grossLoss !== 0 ? grossProfit / Math.abs(grossLoss) : null;
  const expectancy = totalTrades > 0 ? netPnl / totalTrades : 0;
  const avgR =
    rs.length > 0 ? rs.reduce((a, b) => a + b, 0) / rs.length : null;

  return {
    totalTrades,
    netPnl,
    grossProfit,
    grossLoss,
    totalFees,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate,
    profitFactor,
    expectancy,
    avgR,
  };
}

export function buildGroupStat(
  key: string,
  label: string,
  trades: StatInput[],
): GroupStat {
  const a = aggregate(trades);
  return {
    key,
    label,
    trades: a.totalTrades,
    netPnl: r2(a.netPnl),
    winRate: r4(a.winRate),
    profitFactor: a.profitFactor === null ? null : r4(a.profitFactor),
    avgR: a.avgR === null ? null : r3(a.avgR),
    expectancy: r2(a.expectancy),
  };
}

export function dayOfWeekName(d: Date): string {
  return DAY_NAMES[d.getUTCDay()];
}

export function rBucket(r: number): string {
  if (r < -2) return '<-2';
  if (r < -1) return '-2..-1';
  if (r < 0) return '-1..0';
  if (r < 1) return '0..1';
  if (r < 2) return '1..2';
  return '>2';
}

export function toStat(t: {
  pnl: number;
  fees?: number;
  rMultiple: number | null;
}): StatInput {
  return { pnl: t.pnl, fees: t.fees, rMultiple: t.rMultiple };
}

export const money = r2;
export const ratio = r4;
export const rValue = r3;

// ==================== Risk / score helpers ====================

export interface DailyPnl {
  date: string;
  pnl: number;
}

/** Net P&L bucketed per trading day (exit day, falling back to entry day). */
export function dailyPnlSeries(trades: AnalyticsTrade[]): DailyPnl[] {
  const daily = new Map<string, number>();
  for (const t of trades) {
    const key = dayKey(bucketDate(t));
    daily.set(key, (daily.get(key) ?? 0) + t.pnl);
  }
  return [...daily.keys()].sort().map((date) => ({
    date,
    pnl: daily.get(date) ?? 0,
  }));
}

export function mean(values: number[]): number {
  return values.length > 0
    ? values.reduce((a, b) => a + b, 0) / values.length
    : 0;
}

/** Population standard deviation. */
export function stdev(values: number[]): number {
  const n = values.length;
  if (n === 0) {
    return 0;
  }
  const m = mean(values);
  const variance = values.reduce((a, b) => a + (b - m) ** 2, 0) / n;
  return Math.sqrt(variance);
}

/**
 * P&L-based Sharpe proxy: mean(dailyPnl) / stddev(dailyPnl), annualized by
 * sqrt(252) trading days. Uses population stddev. Returns null when there are
 * fewer than 2 trading days or the daily series has zero dispersion.
 */
export function sharpeRatio(dailyPnl: number[]): number | null {
  if (dailyPnl.length < 2) {
    return null;
  }
  const sd = stdev(dailyPnl);
  if (sd === 0) {
    return null;
  }
  return (mean(dailyPnl) / sd) * Math.sqrt(252);
}

export interface DrawdownPoint {
  date: string;
  equity: number;
  /** Drop from the running peak as a negative magnitude (<= 0). */
  drawdown: number;
}

export interface DrawdownSummary {
  /** Largest peak-to-trough drop as a positive magnitude. */
  maxDrawdown: number;
  /** Max drawdown as a % of the peak at the trough; null when peak <= 0. */
  maxDrawdownPct: number | null;
  /** Per-day equity (cumulative P&L) + drawdown curve. */
  curve: DrawdownPoint[];
}

/**
 * Peak-to-trough drawdown over the cumulative-P&L equity series (equity starts
 * at 0). Drawdown magnitude is absolute currency; the % is taken against the
 * running peak at the trough and is null when that peak is non-positive.
 */
export function drawdown(dailyPnl: DailyPnl[]): DrawdownSummary {
  let cumulative = 0;
  let peak = 0;
  let maxDd = 0;
  let maxDdPct: number | null = null;
  const curve: DrawdownPoint[] = [];

  for (const d of dailyPnl) {
    cumulative += d.pnl;
    if (cumulative > peak) {
      peak = cumulative;
    }
    const dd = peak - cumulative;
    if (dd > maxDd) {
      maxDd = dd;
      maxDdPct = peak > 0 ? (dd / peak) * 100 : null;
    }
    curve.push({ date: d.date, equity: cumulative, drawdown: -dd });
  }

  return { maxDrawdown: maxDd, maxDrawdownPct: maxDdPct, curve };
}

export interface TraderScoreBreakdown {
  winRate: number;
  profitFactor: number;
  avgWinLoss: number;
  recoveryFactor: number;
  maxDrawdown: number;
  consistency: number;
}

export interface TraderScoreInputs {
  winRate: number; // 0-1
  profitFactor: number | null;
  avgWinner: number;
  avgLoser: number; // negative
  netPnl: number;
  maxDrawdown: number; // positive magnitude
  maxDrawdownPct: number | null;
  dailyPnl: number[];
}

const clamp100 = (n: number): number => Math.max(0, Math.min(100, n));

/**
 * Composite 0-100 health score blending six normalized sub-scores. Each
 * sub-score is clamped to 0-100; weights sum to 1.0:
 *   winRate 0.20, profitFactor 0.20, avgWinLoss 0.15,
 *   recoveryFactor 0.15, maxDrawdown(inverted) 0.15, consistency 0.15.
 * Normalization targets (score hits 100 at): winRate 100%, profitFactor 3.0,
 * avgWin/avgLoss 3.0, recoveryFactor 3.0. Drawdown score is 100 minus the
 * drawdown %. Consistency is 1 - stddev/|mean| of daily P&L (clamped).
 */
export function computeTraderScore(inputs: TraderScoreInputs): {
  score: number;
  breakdown: TraderScoreBreakdown;
} {
  const winRateScore = clamp100(inputs.winRate * 100);

  const profitFactorScore =
    inputs.profitFactor === null
      ? 100
      : clamp100((inputs.profitFactor / 3) * 100);

  const lossMag = Math.abs(inputs.avgLoser);
  const avgWinLossScore =
    lossMag === 0
      ? inputs.avgWinner > 0
        ? 100
        : 0
      : clamp100((inputs.avgWinner / lossMag / 3) * 100);

  const recoveryFactorScore =
    inputs.maxDrawdown === 0
      ? inputs.netPnl > 0
        ? 100
        : 0
      : clamp100((inputs.netPnl / inputs.maxDrawdown / 3) * 100);

  const maxDrawdownScore =
    inputs.maxDrawdownPct === null ? 100 : clamp100(100 - inputs.maxDrawdownPct);

  const m = mean(inputs.dailyPnl);
  const consistencyScore =
    inputs.dailyPnl.length < 2 || m <= 0
      ? 0
      : clamp100((1 - stdev(inputs.dailyPnl) / m) * 100);

  const breakdown: TraderScoreBreakdown = {
    winRate: round(winRateScore, 1),
    profitFactor: round(profitFactorScore, 1),
    avgWinLoss: round(avgWinLossScore, 1),
    recoveryFactor: round(recoveryFactorScore, 1),
    maxDrawdown: round(maxDrawdownScore, 1),
    consistency: round(consistencyScore, 1),
  };

  const score =
    winRateScore * 0.2 +
    profitFactorScore * 0.2 +
    avgWinLossScore * 0.15 +
    recoveryFactorScore * 0.15 +
    maxDrawdownScore * 0.15 +
    consistencyScore * 0.15;

  return { score: round(clamp100(score), 1), breakdown };
}
