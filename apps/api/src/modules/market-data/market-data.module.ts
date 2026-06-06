import { Module } from '@nestjs/common';
import { InstrumentModule } from '@/modules/instrument/instrument.module';
import { MarketDataController } from '@/modules/market-data/controllers/market-data.controller';
import { marketDataProviderBinding } from '@/modules/market-data/providers/market-data-provider.factory';
import { MarketDataService } from '@/modules/market-data/services/market-data.service';
import { MarketDataGateway } from '@/modules/market-data/gateways/market-data.gateway';

/**
 * Streams server-sourced OHLCV candles over an authenticated websocket.
 * The data source is bound behind {@link MARKET_DATA_PROVIDER}; swap the
 * `useClass` below for a real feed without touching the service or gateway.
 */
@Module({
  imports: [InstrumentModule],
  controllers: [MarketDataController],
  providers: [MarketDataService, MarketDataGateway, marketDataProviderBinding],
  exports: [MarketDataService],
})
export class MarketDataModule {}
