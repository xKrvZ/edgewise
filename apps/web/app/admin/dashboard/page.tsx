'use client';

import { AdminAuditLog, toAuditPage } from '@/components/admin/admin-audit-log';
import { AdminSection } from '@/components/admin/admin-section';
import type { AdminStatsOverviewCard } from '@/components/admin/admin-stats-overview';
import { AdminStatsOverview } from '@/components/admin/admin-stats-overview';
import { PageHeader } from '@/components/app/page-header';
import { PageBody } from '@/components/shared/page-body';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { formatNumber } from '@/lib/format';
import { useQuery } from '@/lib/hooks/use-query';
import { ArrowRight, BookOpen, FileText, NotebookPen, TrendingUp, Users, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const AUDIT_PAGE_SIZE = 10;

export default function AdminDashboardPage() {
  const [auditOffset, setAuditOffset] = useState(0);
  const stats = useQuery(() => api.admin.dashboardStats(), []);
  const audit = useQuery(
    () => api.admin.audit({ limit: AUDIT_PAGE_SIZE, offset: auditOffset }),
    [auditOffset],
  );

  const s = stats.data;
  const auditPage = toAuditPage(audit.data);

  const overviewCards = useMemo<AdminStatsOverviewCard[]>(
    () => [
      {
        key: 'total-users',
        label: 'Total users',
        icon: Users,
        value: formatNumber(s?.users.total ?? 0),
        href: '/admin/users',
      },
      {
        key: 'total-subscriptions',
        label: 'Total subscriptions',
        icon: TrendingUp,
        value: formatNumber(s?.subscriptions.active ?? 0),
        hint: 'Currently active subscriptions',
        href: '/admin/subscriptions',
      },
      {
        key: 'trades-journalled',
        label: 'Trades journalled',
        icon: BookOpen,
        value: formatNumber(s?.trades.total ?? 0),
        hint: `${formatNumber(s?.trades.thisMonth ?? 0)} this month`,
      },
      {
        key: 'journals-created',
        label: 'Journals created',
        icon: NotebookPen,
        value: formatNumber(s?.journals.total ?? 0),
        hint: `${formatNumber(s?.journals.thisMonth ?? 0)} this month`,
      },
      {
        key: 'communities',
        label: 'Communities',
        icon: UsersRound,
        value: formatNumber(s?.communities.total ?? 0),
        hint: `${formatNumber(s?.communities.thisMonth ?? 0)} this month`,
        href: '/admin/communities',
      },
      {
        key: 'posts-created',
        label: 'Posts created',
        icon: FileText,
        value: formatNumber(s?.posts.total ?? 0),
        hint: `${formatNumber(s?.posts.thisMonth ?? 0)} this month`,
        href: '/admin/communities',
      },
    ],
    [s],
  );

  return (
    <PageBody>
      <PageHeader
        eyebrow="Administration"
        title="Dashboard"
        description="Platform snapshot — users, subscriptions, trades, journals, communities, and posts."
        className="border-none pb-0"
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/users">
              Manage users
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <AdminStatsOverview
        title="Overview"
        description="Aggregate totals across the platform."
        columns={6}
        cards={overviewCards}
        isLoading={stats.isLoading}
        error={stats.error}
        onRetry={stats.refetch}
      />

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
