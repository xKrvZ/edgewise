import { Injectable } from '@nestjs/common';
import {
  INTERVAL_MS,
  MAX_CANDLES,
} from '@/modules/market-data/constants/market-data.constants';
import type { Candle } from '@/modules/market-data/interfaces/candle.interface';
import type {
  GetCandlesArgs,
  MarketDataProvider,
} from '@/modules/market-data/interfaces/market-data-provider.interface';

/** Deterministic 32-bit hash for seeding (FNV-1a style). */
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 — small, fast, deterministic PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rough per-symbol base price so charts look plausible. */
function basePriceFor(symbol: string): number {
  const known: Record<string, number> = {
    AAPL: 195,
    MSFT: 420,
    NVDA: 120,
    TSLA: 250,
    SPY: 540,
    QQQ: 470,
    ES: 5400,
    NQ: 19000,
    BTC: 64000,
    ETH: 3400,
    EURUSD: 1.08,
    GBPUSD: 1.27,
  };
  if (known[symbol]) return known[symbol];
  return 20 + (hashString(symbol) % 480);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Deterministic mock OHLCV source. The same `(symbol, time, interval)` always
 * yields the same candle, so replays and backtests are reproducible across
 * reloads. Generates a gentle random-walk with intrabar wicks.
 *
 * Ported verbatim (algorithm) from the former client-side mock so server data
 * is identical to what the UI used to render locally.
 */
@Injectable()
export class MockMarketDataProvider implements MarketDataProvider {
  readonly id = 'mock';

  async getCandles({
    symbol,
    from,
    to,
    interval,
  }: GetCandlesArgs): Promise<Candle[]> {
    const step = INTERVAL_MS[interval];
    if (!step || to <= from || step <= 0) return [];

    const start = Math.floor(from / step) * step;
    const seed = hashString(`${symbol}:${interval}`);
    const rng = mulberry32(seed);
    const base = basePriceFor(symbol);
    const volatility = base * 0.012;

    const candles: Candle[] = [];
    // Walk forward from a stable origin so the series is continuous regardless
    // of the requested window. Anchor the walk to candles since `start`.
    const anchor = mulberry32(seed ^ Math.floor(start / step));
    let price = base * (0.96 + anchor() * 0.08);

    let count = 0;
    for (let t = start; t <= to && count < MAX_CANDLES; t += step, count++) {
      // Drift + noise, with a slow sinusoidal trend for visual variety.
      const trend = Math.sin((t / step) * 0.05 + seed) * volatility * 0.3;
      const drift = (rng() - 0.5) * volatility + trend;
      const open = price;
      const close = Math.max(0.01, open + drift);
      const wick = volatility * (0.4 + rng());
      const high = Math.max(open, close) + rng() * wick;
      const low = Math.max(0.01, Math.min(open, close) - rng() * wick);
      const volume = Math.round(500 + rng() * 9500);

      candles.push({
        time: t,
        open: round(open),
        high: round(high),
        low: round(low),
        close: round(close),
        volume,
      });
      price = close;
    }

    return candles;
  }
}
