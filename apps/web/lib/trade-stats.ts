import type { BacktestTrade, Trade } from '@/lib/types';

export interface TradeStats {
  totalTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  winRate: number;
  profitFactor: number | null;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  avgR: number | null;
  largestWin: number;
  largestLoss: number;
}

interface PnlBearing {
  pnl: number | null;
  rMultiple?: number | null;
  status?: 'open' | 'closed';
}

/**
 * Computes aggregate performance from a set of trades client-side. Used for
 * backtest result summaries and playbook detail stats where a dedicated
 * analytics endpoint isn't available.
 */
export function computeTradeStats(trades: PnlBearing[]): TradeStats {
  const closed = trades.filter((t) => t.pnl !== null && t.pnl !== undefined && t.status !== 'open');
  const pnls = closed.map((t) => t.pnl as number);

  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const grossProfit = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
  const netPnl = pnls.reduce((a, b) => a + b, 0);

  const rValues = closed
    .map((t) => t.rMultiple)
    .filter((r): r is number => r !== null && r !== undefined);

  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
  const avgWin = wins.length ? grossProfit / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const expectancy = closed.length ? netPnl / closed.length : 0;

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    netPnl,
    grossProfit,
    grossLoss,
    winRate,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : null,
    avgWin,
    avgLoss,
    expectancy,
    avgR: rValues.length ? rValues.reduce((a, b) => a + b, 0) / rValues.length : null,
    largestWin: wins.length ? Math.max(...wins) : 0,
    largestLoss: losses.length ? Math.min(...losses) : 0,
  };
}

export type AnyTrade = Trade | BacktestTrade;

/** Cumulative equity series (sorted by exit/entry time) for a set of trades. */
export function buildEquityCurve(
  trades: AnyTrade[],
): { index: number; time: string; cumulativePnl: number }[] {
  const closed = trades
    .filter((t) => t.pnl !== null && t.pnl !== undefined)
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.exitTime ?? a.entryTime).getTime();
      const tb = new Date(b.exitTime ?? b.entryTime).getTime();
      return ta - tb;
    });

  let cum = 0;
  return closed.map((t, i) => {
    cum += t.pnl as number;
    return {
      index: i + 1,
      time: t.exitTime ?? t.entryTime,
      cumulativePnl: Math.round(cum * 100) / 100,
    };
  });
}

/**
 * Derives a 0–100 "rule adherence" score for a playbook from its linked
 * trades. Blends average execution rating (1–5) with the share of trades that
 * recorded no mistakes — a reasonable client-side proxy.
 */
export function computeAdherenceScore(trades: Trade[]): number | null {
  if (!trades.length) return null;
  const rated = trades.filter((t) => t.executionRating !== null && t.executionRating !== undefined);
  const ratingScore = rated.length
    ? (rated.reduce((a, t) => a + (t.executionRating as number), 0) / rated.length / 5) * 100
    : 70;
  const cleanShare =
    trades.filter((t) => (t.mistakeIds ?? t.mistakes ?? []).length === 0).length / trades.length;
  return Math.round(ratingScore * 0.6 + cleanShare * 100 * 0.4);
}
