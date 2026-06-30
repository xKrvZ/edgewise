'use client';

import {
  AdminPeriodSelector,
} from '@/components/admin/admin-period-selector';
import { AdminActivationFunnel } from '@/components/admin/admin-activation-funnel';
import { AdminPostHogSetupBanner } from '@/components/admin/admin-posthog-setup-banner';
import { AdminStatsTrends } from '@/components/admin/admin-stats-trends';
import { PageHeader } from '@/components/app/page-header';
import { PageBody } from '@/components/shared/page-body';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import type { AdminStatsPeriod } from '@/lib/types/admin';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<AdminStatsPeriod>('30d');
  const stats = useQuery(() => api.admin.analyticsStats(period), [period]);

  const s = stats.data;
  const ready = !stats.isLoading;
  const posthogConfigured = s?.posthogConfigured === true;

  if (ready && !posthogConfigured) {
    return (
      <PageBody>
        <PageHeader
          eyebrow="Administration"
          title="Analytics"
          description="Product analytics powered by PostHog."
          className="border-none pb-0"
          actions={
            <Button variant="outline" asChild>
              <Link href="/admin/dashboard">
                View dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <AdminPostHogSetupBanner
          configured={false}
          hasError={s?.posthogFunnelError}
        />
      </PageBody>
    );
  }

  return (
    <PageBody>
      <PageHeader
        eyebrow="Administration"
        title="Analytics"
        description="Trends for acquisition, activation, and conversion from PostHog."
        className="border-none pb-0"
        filters={
          ready ? (
            <AdminPeriodSelector
              period={period}
              onChange={setPeriod}
              aria-label="Analytics metrics period"
            />
          ) : undefined
        }
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">
              View dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {ready && posthogConfigured ? (
        <div className="space-y-6">
          <AdminStatsTrends
            stats={s}
            isLoading={stats.isLoading}
            hasError={Boolean(stats.error)}
            posthogConfigured
          />

          <AdminActivationFunnel
            funnel={s?.activation}
            period={period}
            isLoading={stats.isLoading}
            posthogConfigured
            posthogFunnelError={s?.posthogFunnelError}
          />
        </div>
      ) : null}
    </PageBody>
  );
}
