'use client';

import { useQuery } from '@/lib/hooks/use-query';
import { type Candle, type CandleInterval, INTERVAL_MS, marketData } from '@/lib/market-data';

/**
 * Loads candles for a symbol/window/interval from the active market-data
 * provider (mock by default). Returns the standard query state.
 */
export function useCandles(
  symbol: string | null | undefined,
  from: number | null,
  to: number | null,
  interval: CandleInterval,
) {
  const enabled = Boolean(symbol && from && to && to > from);
  const key = `${symbol}:${from}:${to}:${interval}`;
  return useQuery<Candle[]>(
    () =>
      marketData.getCandles({
        symbol: symbol as string,
        from: from as number,
        to: to as number,
        interval,
      }),
    [key],
    { enabled },
  );
}

/**
 * Picks a sensible interval + padded window for replaying a trade so the chart
 * shows roughly `targetCandles` bars across the trade's lifetime.
 */
export function deriveTradeWindow(
  entryTime: string,
  exitTime: string | null,
  targetCandles = 160,
): { from: number; to: number; interval: CandleInterval } {
  const entry = new Date(entryTime).getTime();
  const exit = exitTime ? new Date(exitTime).getTime() : entry + 2 * 3_600_000;
  const span = Math.max(exit - entry, 3_600_000);
  const padded = span * 0.4;
  const from = entry - padded;
  const to = exit + padded;
  const total = to - from;

  const intervals: CandleInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
  let chosen: CandleInterval = '1m';
  for (const iv of intervals) {
    chosen = iv;
    if (total / INTERVAL_MS[iv] <= targetCandles) break;
  }
  return { from, to, interval: chosen };
}
