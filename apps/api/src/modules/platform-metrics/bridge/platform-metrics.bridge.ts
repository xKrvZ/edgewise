import type { PlatformMetricsService } from '../services/platform-metrics.service';

let platformMetricsService: PlatformMetricsService | null = null;

export function registerPlatformMetricsService(service: PlatformMetricsService): void {
  platformMetricsService = service;
}

export function getPlatformMetricsService(): PlatformMetricsService | null {
  return platformMetricsService;
}

export async function runPlatformMetricsTask(
  task: (service: PlatformMetricsService) => Promise<void>,
): Promise<void> {
  const service = getPlatformMetricsService();
  if (!service) {
    return;
  }

  await task(service);
}
