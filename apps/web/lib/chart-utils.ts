import type { Candle } from '@/lib/market-data';

/** Index of the candle whose open time is closest to `time` (ms). */
export function nearestCandleIndex(candles: Candle[], time: number): number {
  if (!candles.length) return 0;
  let best = 0;
  let bestDiff = Math.abs(candles[0].time - time);
  for (let i = 1; i < candles.length; i++) {
    const diff = Math.abs(candles[i].time - time);
    if (diff < bestDiff) {
      best = i;
      bestDiff = diff;
    }
  }
  return best;
}
