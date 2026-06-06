import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MARKET_DATA_PROVIDER } from '@/modules/market-data/constants/market-data.constants';
import {
  isPolygonProviderEnabled,
  PolygonMarketDataProvider,
} from '@/modules/market-data/providers/polygon-market-data.provider';
import { MockMarketDataProvider } from '@/modules/market-data/providers/mock-market-data.provider';

/**
 * Binds the active {@link MARKET_DATA_PROVIDER} implementation from env.
 * Falls back to mock when `MARKET_DATA_PROVIDER=mock`, polygon is selected
 * without an API key, or an unknown provider id is given.
 */
export const marketDataProviderBinding: Provider = {
  provide: MARKET_DATA_PROVIDER,
  useFactory: (config: ConfigService) => {
    if (isPolygonProviderEnabled(config)) {
      return new PolygonMarketDataProvider(config);
    }
    return new MockMarketDataProvider();
  },
  inject: [ConfigService],
};
