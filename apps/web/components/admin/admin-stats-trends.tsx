'use client';

import { AdminSection } from '@/components/admin/admin-section';
import {
  AdminActivationActivityChart,
  AdminActivationTrendChart,
  AdminCancellationsChart,
  AdminRevenueChart,
  AdminSubscriptionsChart,
  AdminUserSignupsChart,
} from '@/components/admin/admin-stats-charts';
import type { AdminStats } from '@/lib/types/admin';

interface AdminStatsTrendsProps {
  stats: AdminStats | undefined;
  isLoading: boolean;
  hasError: boolean;
  posthogConfigured: boolean;
}

export function AdminStatsTrends({
  stats,
  isLoading,
  hasError,
  posthogConfigured,
}: AdminStatsTrendsProps) {
  if (!posthogConfigured) {
    return null;
  }

  if (hasError) {
    return (
      <AdminSection title="Trends" description="Daily and weekly metrics for the selected period.">
        <p className="text-sm text-muted-foreground">
          Charts are unavailable until metrics load successfully.
        </p>
      </AdminSection>
    );
  }

  return (
    <>
      <AdminSection title="Acquisition" description="How new users are arriving over time.">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <AdminUserSignupsChart data={stats?.users.series ?? []} isLoading={isLoading} />
          <AdminSubscriptionsChart data={stats?.subscriptions.series ?? []} isLoading={isLoading} />
        </div>
      </AdminSection>

      <AdminSection
        title="Activation"
        description="Product usage and weekly drop-off rates from PostHog."
      >
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <AdminActivationActivityChart data={stats?.series ?? []} isLoading={isLoading} />
          <AdminActivationTrendChart
            data={stats?.activationTrend ?? []}
            isLoading={isLoading}
            emptyMessage="Not enough PostHog data for weekly activation trends."
          />
        </div>
      </AdminSection>

      <AdminSection
        title="Conversion & churn"
        description="Revenue collected and subscription cancellations during the selected period."
      >
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <AdminRevenueChart
            data={stats?.revenue.series ?? []}
            isLoading={isLoading}
            revenueSource={stats?.revenueSource}
          />
          <AdminCancellationsChart
            data={stats?.subscriptions.cancellationSeries ?? []}
            isLoading={isLoading}
          />
        </div>
      </AdminSection>
    </>
  );
}
