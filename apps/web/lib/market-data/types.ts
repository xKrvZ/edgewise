/**
 * Market-data abstraction for the replay & backtesting engines.
 *
 * The UI only ever depends on the `MarketDataProvider` interface. A real
 * data source (broker feed, vendor API, backend proxy) can be dropped in
 * later by implementing this interface and swapping the export in
 * `lib/market-data/index.ts` — no page/component changes required.
 */

export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface Candle {
  /** Epoch milliseconds for the candle open. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface GetCandlesParams {
  symbol: string;
  /** Inclusive start (epoch ms). */
  from: number;
  /** Inclusive end (epoch ms). */
  to: number;
  interval: CandleInterval;
}

export interface SubscribeParams extends GetCandlesParams {
  /** Playback speed multiplier for server-driven replay (default 1). */
  speed?: number;
}

export interface MarketDataProvider {
  /** Stable identifier, e.g. "mock" or "polygon". */
  readonly id: string;
  /** Returns OHLCV candles ordered ascending by time (snapshot). */
  getCandles(params: GetCandlesParams): Promise<Candle[]>;
  /**
   * Optional server-driven streaming replay: invokes `onTick` for each candle
   * in order, then `onComplete`. Returns a function that cancels the stream.
   * Providers that only support snapshots may omit this.
   */
  subscribe?(
    params: SubscribeParams,
    onTick: (candle: Candle) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void,
  ): () => void;
}

export const INTERVAL_MS: Record<CandleInterval, number> = {
  '1m': 60_000,
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '1h': 60 * 60_000,
  '4h': 4 * 60 * 60_000,
  '1d': 24 * 60 * 60_000,
};

export const CANDLE_INTERVALS: CandleInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
