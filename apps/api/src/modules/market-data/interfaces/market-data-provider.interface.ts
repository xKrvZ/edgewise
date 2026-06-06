import type { CandleInterval } from '@/modules/market-data/constants/market-data.constants';
import type { Candle } from '@/modules/market-data/interfaces/candle.interface';

export interface GetCandlesArgs {
  symbol: string;
  /** Inclusive start (epoch ms). */
  from: number;
  /** Inclusive end (epoch ms). */
  to: number;
  interval: CandleInterval;
}

/**
 * Server-side market-data source. Implement this and bind it to the
 * `MARKET_DATA_PROVIDER` token to swap in a real feed (vendor API / broker)
 * without changing the service or gateway.
 */
export interface MarketDataProvider {
  /** Stable identifier, e.g. "mock" or "polygon". */
  readonly id: string;
  /** Returns OHLCV candles ordered ascending by time. */
  getCandles(args: GetCandlesArgs): Promise<Candle[]>;
}
