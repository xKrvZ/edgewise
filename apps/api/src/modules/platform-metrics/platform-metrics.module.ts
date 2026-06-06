import { Module } from '@nestjs/common';
import { BillingModule } from '@/modules/billing/billing.module';
import { PlatformDailyMetricDao } from './daos/platform-daily-metric.dao';
import { PlatformEventDao } from './daos/platform-event.dao';
import { PlatformMetricsRollupJob } from './jobs/platform-metrics-rollup.job';
import { PlatformMetricsBootstrapService } from './services/platform-metrics-bootstrap.service';
import { PlatformAuditService } from './services/platform-audit.service';
import { PlatformMetricsService } from './services/platform-metrics.service';

@Module({
  imports: [BillingModule],
  providers: [
    PlatformEventDao,
    PlatformDailyMetricDao,
    PlatformMetricsService,
    PlatformAuditService,
    PlatformMetricsBootstrapService,
    PlatformMetricsRollupJob,
  ],
  exports: [PlatformMetricsService, PlatformAuditService, PlatformEventDao, PlatformDailyMetricDao],
})
export class PlatformMetricsModule {}
