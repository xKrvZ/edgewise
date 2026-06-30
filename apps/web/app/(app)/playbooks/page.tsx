'use client';

import { DateRangeSelector } from '@/components/app/date-range-selector';
import { FeatureAnalyticsTracker } from '@/components/analytics/feature-analytics-tracker';
import { PageFilterBar } from '@/components/app/page-filter-bar';
import { PageHeader } from '@/components/app/page-header';
import { PlaybookPerformanceSection } from '@/components/playbooks/playbook-performance-section';
import { PlaybookCard } from '@/components/playbooks/playbook-card';
import { PlaybookFeaturedCard } from '@/components/playbooks/playbook-featured-card';
import { PlaybookFormDialog } from '@/components/playbooks/playbook-form-dialog';
import { PlaybookGettingStartedCallout } from '@/components/playbooks/playbook-getting-started-callout';
import { PlaybookMetricsBar } from '@/components/playbooks/playbook-metrics-bar';
import { ListSection } from '@/components/shared/list-section';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ListPageSkeleton } from '@/components/shared/list-page-skeleton';
import { PageBody } from '@/components/shared/page-body';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import { summarizePlaybooks } from '@/lib/playbook-stats';
import { BookOpenCheck, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

function sortByRecent<T extends { updatedAt: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export default function PlaybooksPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useQuery(() => api.playbooks.list(), []);
  const [formOpen, setFormOpen] = useState(false);

  const playbooks = data ?? [];
  const summary = useMemo(() => summarizePlaybooks(playbooks), [playbooks]);
  const sortedPlaybooks = useMemo(() => sortByRecent(playbooks), [playbooks]);
  const featuredPlaybook = sortedPlaybooks[0] ?? null;
  const otherPlaybooks = sortedPlaybooks.slice(1);

  function openCreate() {
    setFormOpen(true);
  }

  return (
    <PageBody>
      <FeatureAnalyticsTracker feature="playbook" />
      <PageHeader
        title="Playbooks"
        description="Document your setups and hold yourself to your rules."
        eyebrow="Strategy"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New playbook
          </Button>
        }
      />

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <ListPageSkeleton rows={0} metrics={false} />
      ) : playbooks.length === 0 ? (
        <>
          <PlaybookGettingStartedCallout onCreate={openCreate} />
          <EmptyState
            icon={BookOpenCheck}
            title="No playbooks yet"
            message="Create a playbook to define a setup's entry, exit and risk rules, then link your trades to it."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New playbook
              </Button>
            }
          />
        </>
      ) : (
        <>
          <PageFilterBar>
            <DateRangeSelector />
          </PageFilterBar>

          <PlaybookMetricsBar summary={summary} />

          <PlaybookPerformanceSection />

          {featuredPlaybook && (
            <PlaybookFeaturedCard
              playbook={featuredPlaybook}
              onOpen={() => router.push(`/playbooks/${featuredPlaybook.id}`)}
            />
          )}

          {otherPlaybooks.length > 0 && (
            <ListSection
              title="Your playbooks"
              countLabel={`${otherPlaybooks.length} more`}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherPlaybooks.map((p) => (
                  <PlaybookCard
                    key={p.id}
                    playbook={p}
                    onOpen={() => router.push(`/playbooks/${p.id}`)}
                  />
                ))}
              </div>
            </ListSection>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Link trades to a playbook to see which setups actually perform.
          </p>
        </>
      )}

      <PlaybookFormDialog open={formOpen} onOpenChange={setFormOpen} onSaved={() => refetch()} />
    </PageBody>
  );
}
