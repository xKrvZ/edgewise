import { Global, Module } from '@nestjs/common';
import { AnalyticsCacheService } from './analytics-cache.service';

/**
 * Global so any module that writes trades (e.g. TradeModule) can inject
 * {@link AnalyticsCacheService} to invalidate cached analytics, without
 * coupling to the analytics feature module.
 */
@Global()
@Module({
  providers: [AnalyticsCacheService],
  exports: [AnalyticsCacheService],
})
export class AnalyticsCacheModule {}
