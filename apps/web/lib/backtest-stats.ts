import type { Backtest } from '@/lib/types';

export interface BacktestListSummary {
  total: number;
  totalTrades: number;
  aggregatePnl: number | null;
  uniqueSymbols: number;
  mostRecent: Backtest | null;
  bestPerformer: Backtest | null;
}

export function summarizeBacktests(backtests: Backtest[]): BacktestListSummary {
  const total = backtests.length;
  const totalTrades = backtests.reduce((sum, b) => sum + b.tradeCount, 0);

  const withPnl = backtests.filter((b) => b.netPnl !== null);
  const aggregatePnl =
    withPnl.length > 0 ? withPnl.reduce((sum, b) => sum + (b.netPnl ?? 0), 0) : null;

  const uniqueSymbols = new Set(backtests.map((b) => b.symbol)).size;

  const mostRecent =
    backtests.length > 0
      ? [...backtests].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )[0]
      : null;

  const bestPerformer =
    withPnl.length > 0
      ? [...withPnl].sort((a, b) => (b.netPnl ?? 0) - (a.netPnl ?? 0))[0]
      : null;

  return {
    total,
    totalTrades,
    aggregatePnl,
    uniqueSymbols,
    mostRecent,
    bestPerformer,
  };
}
