import { Module } from '@nestjs/common';
import { MARKET_DATA_PROVIDER } from '@/modules/market-data/constants/market-data.constants';
import { MarketDataController } from '@/modules/market-data/controllers/market-data.controller';
import { MockMarketDataProvider } from '@/modules/market-data/providers/mock-market-data.provider';
import { MarketDataService } from '@/modules/market-data/services/market-data.service';
import { MarketDataGateway } from '@/modules/market-data/gateways/market-data.gateway';

/**
 * Streams server-sourced OHLCV candles over an authenticated websocket.
 * The data source is bound behind {@link MARKET_DATA_PROVIDER}; swap the
 * `useClass` below for a real feed without touching the service or gateway.
 */
@Module({
  controllers: [MarketDataController],
  providers: [
    MarketDataService,
    MarketDataGateway,
    {
      provide: MARKET_DATA_PROVIDER,
      useClass: MockMarketDataProvider,
    },
  ],
  exports: [MarketDataService],
})
export class MarketDataModule {}
