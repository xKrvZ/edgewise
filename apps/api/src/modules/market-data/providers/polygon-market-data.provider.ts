import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  INTERVAL_MS,
  type CandleInterval,
} from '@/modules/market-data/constants/market-data.constants';
import type { Candle } from '@/modules/market-data/interfaces/candle.interface';
import type {
  GetCandlesArgs,
  MarketDataProvider,
} from '@/modules/market-data/interfaces/market-data-provider.interface';

/** Polygon/Massive aggregate bar (stocks, forex, crypto). */
interface PolygonAggResult {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface PolygonAggsResponse {
  status: string;
  results?: PolygonAggResult[];
  resultsCount?: number;
  next_url?: string;
}

/** Polygon/Massive futures aggregate bar. */
interface PolygonFuturesAggResult {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  window_start: number;
}

interface PolygonFuturesAggsResponse {
  status: string;
  results?: PolygonFuturesAggResult[];
  next_url?: string;
}

const INTERVAL_TO_POLYGON: Record<
  CandleInterval,
  { multiplier: number; timespan: string }
> = {
  '1m': { multiplier: 1, timespan: 'minute' },
  '5m': { multiplier: 5, timespan: 'minute' },
  '15m': { multiplier: 15, timespan: 'minute' },
  '1h': { multiplier: 1, timespan: 'hour' },
  '4h': { multiplier: 4, timespan: 'hour' },
  '1d': { multiplier: 1, timespan: 'day' },
};

const FUTURES_RESOLUTION: Record<CandleInterval, string> = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '1h': '1hour',
  '4h': '4hour',
  '1d': '1session',
};

/**
 * Massive (formerly Polygon.io) REST provider.
 *
 * Stocks/forex/crypto use `/v2/aggs/ticker/{ticker}/range/...`.
 * US futures use `/futures/v1/aggs/{contractTicker}` (requires a contract month
 * or continuous symbol in `providerSymbol`, e.g. `ESU5` or vendor-specific).
 *
 * Set `MARKET_DATA_PROVIDER=polygon` and `POLYGON_API_KEY` to enable.
 * Without a key, {@link MarketDataModule} should bind the mock provider instead.
 */
@Injectable()
export class PolygonMarketDataProvider implements MarketDataProvider {
  readonly id = 'polygon';

  private readonly logger = new Logger(PolygonMarketDataProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('POLYGON_API_KEY', '');
    this.baseUrl = this.config.get<string>(
      'POLYGON_API_BASE_URL',
      'https://api.polygon.io',
    );
  }

  async getCandles(args: GetCandlesArgs): Promise<Candle[]> {
    if (!this.apiKey) {
      throw new Error('POLYGON_API_KEY is not configured');
    }

    const feedSymbol = args.symbol;
    if (this.looksLikeFuturesContract(feedSymbol)) {
      return this.fetchFuturesCandles(args, feedSymbol);
    }
    return this.fetchStandardCandles(args, feedSymbol);
  }

  private looksLikeFuturesContract(symbol: string): boolean {
    // Contract month suffix (e.g. ESU5, NQZ24) or explicit futures prefix.
    return /^[A-Z]{1,4}[FGHJKMNQUVXZ]\d{1,2}$/.test(symbol) || symbol.startsWith('F:');
  }

  private async fetchStandardCandles(
    { from, to, interval }: GetCandlesArgs,
    ticker: string,
  ): Promise<Candle[]> {
    const { multiplier, timespan } = INTERVAL_TO_POLYGON[interval];
    const fromDate = this.toDatePath(from);
    const toDate = this.toDatePath(to);
    const url = new URL(
      `/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/${multiplier}/${timespan}/${fromDate}/${toDate}`,
      this.baseUrl,
    );
    url.searchParams.set('adjusted', 'true');
    url.searchParams.set('sort', 'asc');
    url.searchParams.set('limit', '50000');
    url.searchParams.set('apiKey', this.apiKey);

    const candles: Candle[] = [];
    let nextUrl: string | undefined = url.toString();

    while (nextUrl) {
      const page = await this.getJson<PolygonAggsResponse>(nextUrl);
      if (page.status === 'ERROR' || !page.results?.length) break;

      for (const bar of page.results) {
        if (bar.t < from || bar.t > to) continue;
        candles.push({
          time: bar.t,
          open: bar.o,
          high: bar.h,
          low: bar.l,
          close: bar.c,
          volume: bar.v,
        });
      }

      nextUrl = page.next_url
        ? `${page.next_url}&apiKey=${this.apiKey}`
        : undefined;
    }

    return this.dedupeByTime(candles);
  }

  private async fetchFuturesCandles(
    { from, to, interval }: GetCandlesArgs,
    ticker: string,
  ): Promise<Candle[]> {
    const resolution = FUTURES_RESOLUTION[interval];
    const url = new URL(
      `/futures/v1/aggs/${encodeURIComponent(ticker)}`,
      this.baseUrl,
    );
    url.searchParams.set('resolution', resolution);
    url.searchParams.set('window_start.gte', String(from * 1_000_000));
    url.searchParams.set('window_start.lte', String(to * 1_000_000));
    url.searchParams.set('sort', 'window_start.asc');
    url.searchParams.set('limit', '50000');
    url.searchParams.set('apiKey', this.apiKey);

    const candles: Candle[] = [];
    let nextUrl: string | undefined = url.toString();

    while (nextUrl) {
      const page = await this.getJson<PolygonFuturesAggsResponse>(nextUrl);
      if (page.status === 'ERROR' || !page.results?.length) break;

      for (const bar of page.results) {
        const timeMs = Math.floor(bar.window_start / 1_000_000);
        if (timeMs < from || timeMs > to) continue;
        candles.push({
          time: timeMs,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume,
        });
      }

      nextUrl = page.next_url
        ? `${page.next_url}&apiKey=${this.apiKey}`
        : undefined;
    }

    return this.dedupeByTime(candles);
  }

  private async getJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      this.logger.warn(`Polygon request failed (${res.status}): ${body.slice(0, 200)}`);
      throw new Error(`Polygon API error: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  private toDatePath(epochMs: number): string {
    return new Date(epochMs).toISOString().slice(0, 10);
  }

  private dedupeByTime(candles: Candle[]): Candle[] {
    const byTime = new Map<number, Candle>();
    for (const c of candles) byTime.set(c.time, c);
    return [...byTime.values()].sort((a, b) => a.time - b.time);
  }
}

/** Maps catalog symbols to Polygon tickers when `providerSymbol` is unset. */
export function toPolygonTicker(
  symbol: string,
  assetClass?: string,
): string {
  const upper = symbol.trim().toUpperCase();
  switch (assetClass) {
    case 'forex':
      return `C:${upper}`;
    case 'crypto':
      return `X:${upper.replace(/USD$/, '')}USD`;
    case 'futures':
      // Catalog stores root symbols (ES, NQ); set providerSymbol to a contract.
      return upper;
    default:
      return upper;
  }
}

/** True when the configured provider id should use Polygon. */
export function isPolygonProviderEnabled(config: ConfigService): boolean {
  const id = config.get<string>('MARKET_DATA_PROVIDER', 'mock').toLowerCase();
  const key = config.get<string>('POLYGON_API_KEY', '');
  return id === 'polygon' && key.length > 0;
}
