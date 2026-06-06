import { Inject, Injectable } from '@nestjs/common';
import {
  CANDLE_INTERVALS,
  type CandleInterval,
  MARKET_DATA_PROVIDER,
} from '@/modules/market-data/constants/market-data.constants';
import type { Candle } from '@/modules/market-data/interfaces/candle.interface';
import type { MarketDataProvider } from '@/modules/market-data/interfaces/market-data-provider.interface';

/**
 * Orchestrates market-data retrieval on top of the injected provider. Holds
 * the (small) business logic — input normalization and the provider hand-off —
 * so the gateway stays a thin transport/delegation layer. Throws on invalid
 * input; the gateway maps thrown errors to `candles:error`.
 */
@Injectable()
export class MarketDataService {
  constructor(
    @Inject(MARKET_DATA_PROVIDER)
    private readonly provider: MarketDataProvider,
  ) {}

  get providerId(): string {
    return this.provider.id;
  }

  isValidInterval(interval: string): interval is CandleInterval {
    return (CANDLE_INTERVALS as readonly string[]).includes(interval);
  }

  /**
   * Fetches candles for a window. Assumes inputs were already shape-validated
   * by the gateway DTO; returns the provider's ascending-by-time series.
   */
  async getCandles(
    symbol: string,
    from: number,
    to: number,
    interval: CandleInterval,
  ): Promise<Candle[]> {
    return this.provider.getCandles({ symbol, from, to, interval });
  }
}
