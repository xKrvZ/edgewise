'use client';

import { PageHeader } from '@/components/app/page-header';
import { BacktestCard } from '@/components/backtesting/backtest-card';
import { BacktestFeaturedCard } from '@/components/backtesting/backtest-featured-card';
import { BacktestFormDialog } from '@/components/backtesting/backtest-form-dialog';
import { BacktestGettingStartedCallout } from '@/components/backtesting/backtest-getting-started-callout';
import { BacktestMetricsBar } from '@/components/backtesting/backtest-metrics-bar';
import { ListSection } from '@/components/shared/list-section';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ListPageSkeleton } from '@/components/shared/list-page-skeleton';
import { PageBody } from '@/components/shared/page-body';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { summarizeBacktests } from '@/lib/backtest-stats';
import { useQuery } from '@/lib/hooks/use-query';
import type { Backtest } from '@/lib/types';
import { FlaskConical, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

function sortByRecent(backtests: Backtest[]): Backtest[] {
  return [...backtests].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export default function BacktestingPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useQuery(() => api.backtests.list(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Backtest | undefined>(undefined);
  const [deleting, setDeleting] = useState<Backtest | undefined>(undefined);

  const backtests = data ?? [];
  const summary = useMemo(() => summarizeBacktests(backtests), [backtests]);
  const sortedBacktests = useMemo(() => sortByRecent(backtests), [backtests]);
  const featuredBacktest = sortedBacktests[0] ?? null;
  const otherBacktests = sortedBacktests.slice(1);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api.backtests.remove(deleting.id);
      toast.success('Backtest deleted');
      refetch();
    } catch {
      toast.error('Failed to delete backtest');
    }
  }

  function openBacktest(backtest: Backtest) {
    router.push(`/backtesting/${backtest.id}`);
  }

  function editBacktest(backtest: Backtest) {
    setEditing(backtest);
    setFormOpen(true);
  }

  return (
    <PageBody>
      <PageHeader
        title="Backtesting"
        description="Replay historical setups and measure simulated performance."
        eyebrow="Simulation"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New backtest
          </Button>
        }
      />

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <ListPageSkeleton rows={0} />
      ) : backtests.length === 0 ? (
        <>
          <BacktestGettingStartedCallout onCreate={openCreate} />
          <EmptyState
            icon={FlaskConical}
            title="No backtests yet"
            message="Create a backtest to replay a period and log simulated trades against your setup."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New backtest
              </Button>
            }
          />
        </>
      ) : (
        <>
          <BacktestMetricsBar summary={summary} />

          {featuredBacktest && (
            <BacktestFeaturedCard
              backtest={featuredBacktest}
              onOpen={() => openBacktest(featuredBacktest)}
              onEdit={() => editBacktest(featuredBacktest)}
              onDelete={() => setDeleting(featuredBacktest)}
            />
          )}

          {otherBacktests.length > 0 && (
            <ListSection
              title="Your backtests"
              countLabel={formatCount(otherBacktests.length)}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherBacktests.map((b) => (
                  <BacktestCard
                    key={b.id}
                    backtest={b}
                    onOpen={() => openBacktest(b)}
                    onEdit={() => editBacktest(b)}
                    onDelete={() => setDeleting(b)}
                  />
                ))}
              </div>
            </ListSection>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Open a backtest to replay candles and log trades — analytics update as you go.
          </p>
        </>
      )}

      <BacktestFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        backtest={editing}
        onSaved={(b) => {
          refetch();
          router.push(`/backtesting/${b.id}`);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Delete this backtest?"
        description="All recorded simulated trades will be removed too."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </PageBody>
  );
}

function formatCount(count: number): string {
  return `${count} more`;
}
