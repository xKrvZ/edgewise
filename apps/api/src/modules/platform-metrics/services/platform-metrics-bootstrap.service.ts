import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { registerPlatformMetricsService } from '../bridge/platform-metrics.bridge';
import { PlatformMetricsService } from './platform-metrics.service';

@Injectable()
export class PlatformMetricsBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(PlatformMetricsBootstrapService.name);

  constructor(private readonly platformMetricsService: PlatformMetricsService) {}

  onModuleInit(): void {
    registerPlatformMetricsService(this.platformMetricsService);

    void this.platformMetricsService.rebuildDailyRollups().catch((error) => {
      this.logger.warn(
        `Initial platform metrics rollup skipped: ${error instanceof Error ? error.message : error}`,
      );
    });
  }
}
