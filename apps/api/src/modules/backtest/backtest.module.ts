import { Module } from '@nestjs/common';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { BacktestController } from './controllers/backtest.controller';
import { BacktestAnalyticsService } from './services/backtest-analytics.service';
import { BacktestService } from './services/backtest.service';
import { BacktestDao } from './daos/backtest.dao';
import { BacktestTradeDao } from './daos/backtest-trade.dao';

@Module({
  imports: [AnalyticsModule],
  controllers: [BacktestController],
  providers: [
    BacktestService,
    BacktestAnalyticsService,
    BacktestDao,
    BacktestTradeDao,
  ],
  exports: [BacktestService, BacktestDao, BacktestTradeDao],
})
export class BacktestModule {}
