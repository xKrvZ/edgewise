import type { WebhooksOptions } from '@polar-sh/better-auth';
import { runPlatformMetricsTask } from '../bridge/platform-metrics.bridge';

function fireAndForget(task: () => Promise<void>): void {
  void task().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(
      'Platform metrics webhook handler failed:',
      error instanceof Error ? error.message : error,
    );
  });
}

export function createPolarWebhookHandlers(): Pick<
  WebhooksOptions,
  | 'onOrderPaid'
  | 'onOrderRefunded'
  | 'onSubscriptionActive'
  | 'onSubscriptionCanceled'
  | 'onSubscriptionRevoked'
  | 'onSubscriptionUncanceled'
> {
  return {
    onOrderPaid: async (payload) => {
      fireAndForget(() =>
        runPlatformMetricsTask((service) => service.handlePolarOrderPaid(payload)),
      );
    },
    onOrderRefunded: async (payload) => {
      fireAndForget(() =>
        runPlatformMetricsTask((service) => service.handlePolarOrderRefunded(payload)),
      );
    },
    onSubscriptionActive: async (payload) => {
      fireAndForget(() =>
        runPlatformMetricsTask((service) => service.handlePolarSubscriptionActive(payload)),
      );
    },
    onSubscriptionCanceled: async (payload) => {
      fireAndForget(() =>
        runPlatformMetricsTask((service) => service.handlePolarSubscriptionCanceled(payload)),
      );
    },
    onSubscriptionRevoked: async (payload) => {
      fireAndForget(() =>
        runPlatformMetricsTask((service) => service.handlePolarSubscriptionRevoked(payload)),
      );
    },
    onSubscriptionUncanceled: async (payload) => {
      fireAndForget(() =>
        runPlatformMetricsTask((service) => service.handlePolarSubscriptionActive(payload)),
      );
    },
  };
}
