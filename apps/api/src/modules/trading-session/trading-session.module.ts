import { Module } from '@nestjs/common';
import { TradingSessionController } from './controllers/trading-session.controller';
import { TradingSessionService } from './services/trading-session.service';
import { TradingSessionDao } from './daos/trading-session.dao';

@Module({
  controllers: [TradingSessionController],
  providers: [TradingSessionService, TradingSessionDao],
  exports: [TradingSessionService, TradingSessionDao],
})
export class TradingSessionModule {}
