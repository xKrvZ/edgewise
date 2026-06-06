'use client';

import { AdminAuditLog, toAuditPage } from '@/components/admin/admin-audit-log';
import {
  ADMIN_PERIOD_LABELS,
  AdminPeriodSelector,
} from '@/components/admin/admin-period-selector';
import { AdminSection } from '@/components/admin/admin-section';
import {
  AdminRevenueChart,
  AdminUserSignupsChart,
} from '@/components/admin/admin-stats-charts';
import { PageHeader } from '@/components/app/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { PageBody } from '@/components/shared/page-body';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { formatCurrency, formatNumber } from '@/lib/format';
import { useQuery } from '@/lib/hooks/use-query';
import type { AdminStatsPeriod } from '@/lib/types/admin';
import { ArrowRight, DollarSign, TrendingUp, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const AUDIT_PAGE_SIZE = 10;

function sumSignups(series: { count: number }[] | undefined): number {
  return (series ?? []).reduce((sum, point) => sum + point.count, 0);
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<AdminStatsPeriod>('30d');
  const [auditOffset, setAuditOffset] = useState(0);
  const stats = useQuery(() => api.admin.stats(period), [period]);
  const audit = useQuery(
    () => api.admin.audit({ limit: AUDIT_PAGE_SIZE, offset: auditOffset }),
    [auditOffset],
  );

  const s = stats.data;
  const auditPage = toAuditPage(audit.data);
  const isLoading = stats.isLoading;
  const periodLabel = ADMIN_PERIOD_LABELS[period];

  const signupsInPeriod = useMemo(() => sumSignups(s?.users.series), [s?.users.series]);
  const revenueInPeriod = s?.revenue.total ?? 0;

  return (
    <PageBody>
      <PageHeader
        eyebrow="Administration"
        title="Dashboard"
        description="Platform health at a glance — user growth, revenue, and administrative activity."
        className="border-none pb-0"
        filters={
          <AdminPeriodSelector
            period={period}
            onChange={setPeriod}
            aria-label="Dashboard metrics period"
          />
        }
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/users">
              Manage users
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <AdminSection
        title="Overview"
        description="Headline metrics for the selected period."
      >
        {stats.error ? (
          <ErrorState onRetry={stats.refetch} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
            <Link
              href="/admin/users"
              className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <StatCard
                label="Total users"
                icon={Users}
                isLoading={isLoading}
                value={formatNumber(s?.users.total ?? 0)}
                hint="All registered accounts"
              />
            </Link>
            <StatCard
              label={`New users (${periodLabel})`}
              icon={UserPlus}
              isLoading={isLoading}
              value={formatNumber(signupsInPeriod)}
              hint={`${formatNumber(s?.users.last24h ?? 0)} in the last 24 hours`}
            />
            <Link
              href="/admin/subscriptions"
              className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <StatCard
                label="Active subscriptions"
                icon={TrendingUp}
                isLoading={isLoading}
                value={formatNumber(s?.subscriptions.active ?? 0)}
                hint={`${formatNumber(s?.subscriptions.canceled ?? 0)} canceled`}
              />
            </Link>
            <StatCard
              label={`Revenue (${periodLabel})`}
              icon={DollarSign}
              isLoading={isLoading}
              value={formatCurrency(revenueInPeriod)}
              hint={
                s?.revenueSource === 'rollup'
                  ? 'From billing rollups'
                  : s?.revenueSource === 'polar'
                    ? 'From Polar orders'
                    : s?.revenueSource === 'estimate'
                      ? 'Estimated from subscriptions'
                      : 'Demo data (mock billing)'
              }
            />
          </div>
        )}
      </AdminSection>

      <AdminSection
        title="Trends"
        description="Daily signups and revenue for the selected period."
      >
        {stats.error ? (
          <p className="text-sm text-muted-foreground">
            Charts are unavailable until metrics load successfully.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <AdminUserSignupsChart data={s?.users.series ?? []} isLoading={isLoading} />
            <AdminRevenueChart
              data={s?.revenue.series ?? []}
              isLoading={isLoading}
              revenueSource={s?.revenueSource}
            />
          </div>
        )}
      </AdminSection>

      <AdminSection
        title="Administrative audit log"
        description="Bans, role changes, subscription overrides, and other actions performed by administrators."
      >
        <AdminAuditLog
          showHeader={false}
          entries={auditPage.entries}
          total={auditPage.total}
          limit={auditPage.limit}
          offset={auditPage.offset}
          isLoading={audit.isLoading}
          error={audit.error?.message ?? null}
          onRetry={audit.refetch}
          onPageChange={setAuditOffset}
          showSubject
          showActor
          emptyMessage="When administrators take action on users, those events will appear here."
        />
      </AdminSection>
    </PageBody>
  );
}
