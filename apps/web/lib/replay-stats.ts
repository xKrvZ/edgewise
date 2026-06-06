import type { Candle } from '@/lib/market-data';

export interface MaeMfeResult {
  /** Max adverse excursion in currency (negative number). */
  mae: number;
  /** Max favorable excursion in currency (positive number). */
  mfe: number;
}

/**
 * Estimates MAE/MFE from candle OHLC between trade entry and exit (or up to
 * `upToTime` for partial replay). Uses high/low per candle; approximate when
 * intrabar path is unknown.
 */
export function computeMaeMfe(
  trade: {
    direction: string;
    entryPrice: number;
    quantity: number;
    entryTime: string;
    exitTime: string | null;
  },
  candles: Candle[],
  upToTime?: number,
): MaeMfeResult | null {
  const entryMs = new Date(trade.entryTime).getTime();
  const exitMs = upToTime ?? (trade.exitTime ? new Date(trade.exitTime).getTime() : Date.now());
  if (!Number.isFinite(entryMs) || !Number.isFinite(exitMs)) {
    return null;
  }

  const window = candles.filter((c) => c.time >= entryMs && c.time <= exitMs);
  if (window.length === 0) {
    return null;
  }

  const isLong = trade.direction === 'long';
  let worstAdverse = 0;
  let bestFavorable = 0;

  for (const c of window) {
    const adversePrice = isLong ? trade.entryPrice - c.low : c.high - trade.entryPrice;
    const favorablePrice = isLong ? c.high - trade.entryPrice : trade.entryPrice - c.low;
    if (adversePrice > worstAdverse) worstAdverse = adversePrice;
    if (favorablePrice > bestFavorable) bestFavorable = favorablePrice;
  }

  const qty = trade.quantity;
  return {
    mae: -worstAdverse * qty,
    mfe: bestFavorable * qty,
  };
}
