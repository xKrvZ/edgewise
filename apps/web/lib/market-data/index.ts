import type { MarketDataProvider } from '@/lib/market-data/types';
import { WebSocketMarketDataProvider } from '@/lib/market-data/websocket-provider';

export * from '@/lib/market-data/types';
export { disconnectMarketDataSocket } from '@/lib/market-data/socket-client';

/**
 * The active market-data provider. Candles are sourced from the server over an
 * authenticated websocket (`/market-data` namespace). Everything else in the
 * app depends only on the `MarketDataProvider` interface, so a different
 * transport or a real live feed can be swapped in here with no UI changes.
 */
export const marketData: MarketDataProvider = new WebSocketMarketDataProvider();
