import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PlatformMetricsService } from '../services/platform-metrics.service';

@Injectable()
export class PlatformMetricsRollupJob {
  private readonly logger = new Logger(PlatformMetricsRollupJob.name);

  constructor(private readonly platformMetricsService: PlatformMetricsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async rebuildDailyRollups(): Promise<void> {
    try {
      await this.platformMetricsService.rebuildDailyRollups();
    } catch (error) {
      this.logger.error(
        `Platform metrics rollup failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
