import { Module } from '@nestjs/common';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsComputationService } from './services/analytics-computation.service';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsDao } from './daos/analytics.dao';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsComputationService, AnalyticsDao],
  exports: [AnalyticsService, AnalyticsComputationService, AnalyticsDao],
})
export class AnalyticsModule {}
