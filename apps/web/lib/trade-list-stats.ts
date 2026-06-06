import { computeTradeStats } from '@/lib/trade-stats';
import type { Trade } from '@/lib/types';

export interface TradeListSummary {
  total: number;
  pageTradeCount: number;
  winRate: number | null;
  netPnl: number | null;
  lastTradeDate: string | null;
  mostRecent: Trade | null;
  isFullPage: boolean;
}

export function summarizeTrades(
  trades: Trade[],
  total: number,
  pageCount: number,
): TradeListSummary {
  const isFullPage = pageCount <= 1;
  const stats = isFullPage ? computeTradeStats(trades) : null;

  const mostRecent =
    trades.length > 0
      ? [...trades].sort(
          (a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime(),
        )[0]
      : null;

  return {
    total,
    pageTradeCount: trades.length,
    winRate: stats && stats.closedTrades > 0 ? stats.winRate : null,
    netPnl: stats && stats.closedTrades > 0 ? stats.netPnl : null,
    lastTradeDate: mostRecent?.entryTime ?? null,
    mostRecent,
    isFullPage,
  };
}
