import { Module, forwardRef } from '@nestjs/common';
import { CommunityModule } from '@/modules/community/community.module';
import { InstrumentModule } from '@/modules/instrument/instrument.module';
import { SharingModule } from '@/modules/sharing/sharing.module';
import { TradingSessionModule } from '@/modules/trading-session/trading-session.module';
import { TradeController } from './controllers/trade.controller';
import { TradeService } from './services/trade.service';
import { TradeDao } from './daos/trade.dao';

@Module({
  imports: [
    forwardRef(() => SharingModule),
    CommunityModule,
    InstrumentModule,
    TradingSessionModule,
  ],
  controllers: [TradeController],
  providers: [TradeService, TradeDao],
  exports: [TradeService, TradeDao],
})
export class TradeModule {}
