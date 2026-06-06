'use client';

import { CommentsSection } from '@/components/comments/comments-section';
import { ChecklistEditor } from '@/components/playbooks/checklist-editor';
import { PlaybookFormDialog } from '@/components/playbooks/playbook-form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DetailBackLink } from '@/components/shared/detail-back-link';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageBody } from '@/components/shared/page-body';
import { ScreenshotGallery } from '@/components/shared/screenshot-gallery';
import { StatCard } from '@/components/shared/stat-card';
import { TradesTable } from '@/components/trades/trades-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { formatCurrency, formatPercent, formatProfitFactor, pnlColor } from '@/lib/format';
import { useQuery } from '@/lib/hooks/use-query';
import { computeAdherenceScore, computeTradeStats } from '@/lib/trade-stats';
import { LineChart, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function PlaybookDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusComments = searchParams.get('comments') === '1';
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: playbook, isLoading, error, refetch } = useQuery(() => api.playbooks.get(id), [id]);
  const tradesQuery = useQuery(() => api.trades.list({ playbookId: id, limit: 200 }), [id]);

  const trades = useMemo(() => tradesQuery.data?.items ?? [], [tradesQuery.data]);
  const stats = useMemo(() => computeTradeStats(trades), [trades]);
  const adherence = useMemo(() => computeAdherenceScore(trades), [trades]);

  const bestTrade = useMemo(
    () =>
      trades.reduce<(typeof trades)[number] | null>(
        (best, t) =>
          (t.pnl ?? Number.NEGATIVE_INFINITY) > (best?.pnl ?? Number.NEGATIVE_INFINITY) ? t : best,
        null,
      ),
    [trades],
  );
  const worstTrade = useMemo(
    () =>
      trades.reduce<(typeof trades)[number] | null>(
        (worst, t) =>
          (t.pnl ?? Number.POSITIVE_INFINITY) < (worst?.pnl ?? Number.POSITIVE_INFINITY)
            ? t
            : worst,
        null,
      ),
    [trades],
  );

  async function confirmDelete() {
    try {
      await api.playbooks.remove(id);
      toast.success('Playbook deleted');
      router.push('/playbooks');
    } catch {
      toast.error('Failed to delete playbook');
    }
  }

  if (error) {
    return (
      <PageBody>
        <DetailBackLink href="/playbooks" label="Back to playbooks" />
        <ErrorState title="Playbook not found" onRetry={refetch} />
      </PageBody>
    );
  }

  if (isLoading || !playbook) {
    return (
      <PageBody>
        <DetailBackLink href="/playbooks" label="Back to playbooks" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </PageBody>
    );
  }

  const rules: { label: string; value: string | null }[] = [
    { label: 'Market conditions', value: playbook.marketConditions },
    { label: 'Entry criteria', value: playbook.entryCriteria },
    { label: 'Exit criteria', value: playbook.exitCriteria },
    { label: 'Risk rules', value: playbook.riskRules },
    { label: 'Invalidation rules', value: playbook.invalidationRules },
  ];

  return (
    <PageBody>
      <DetailBackLink href="/playbooks" label="Back to playbooks" />

      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{playbook.name}</h1>
          {playbook.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{playbook.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Net P&L"
          isLoading={tradesQuery.isLoading}
          value={formatCurrency(stats.netPnl, { signed: true })}
          valueClassName={pnlColor(stats.netPnl)}
          hint={`${stats.closedTrades} closed`}
        />
        <StatCard
          label="Win rate"
          isLoading={tradesQuery.isLoading}
          value={formatPercent(stats.winRate)}
        />
        <StatCard
          label="Profit factor"
          isLoading={tradesQuery.isLoading}
          value={formatProfitFactor(stats.profitFactor)}
        />
        <StatCard
          label="Total trades"
          isLoading={tradesQuery.isLoading}
          value={String(stats.totalTrades)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rules.every((r) => !r.value) ? (
              <p className="text-sm text-muted-foreground">
                No rules documented yet. Edit this playbook to add them.
              </p>
            ) : (
              rules.map(
                (r) =>
                  r.value && (
                    <div key={r.label}>
                      <p className="text-xs font-medium text-muted-foreground">{r.label}</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm">{r.value}</p>
                    </div>
                  ),
              )
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rule adherence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {adherence === null ? (
              <p className="text-sm text-muted-foreground">
                Link trades to this playbook to measure adherence.
              </p>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-semibold tabular-nums">{adherence}</span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
                <Progress value={adherence} />
                <p className="text-xs text-muted-foreground">
                  Blended from execution ratings and how often you traded this setup without logging
                  a mistake.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ChecklistEditor playbookId={playbook.id} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <ScreenshotGallery playbookId={playbook.id} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BestWorstCard title="Best trade" trade={bestTrade} />
        <BestWorstCard title="Worst trade" trade={worstTrade} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trades using this playbook</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {tradesQuery.isLoading ? (
            <div className="space-y-2 px-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : trades.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState
                icon={LineChart}
                title="No linked trades"
                message="Link trades to this playbook to measure how the setup performs."
              />
            </div>
          ) : (
            <TradesTable
              trades={trades}
              compact
              onRowClick={(t) => router.push(`/trades/${t.id}`)}
            />
          )}
        </CardContent>
      </Card>

      <CommentsSection targetType="playbook" targetId={playbook.id} focus={focusComments} />

      <PlaybookFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        playbook={playbook}
        onSaved={() => refetch()}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this playbook?"
        description="Linked trades won't be deleted, but they'll lose this setup."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </PageBody>
  );
}

function BestWorstCard({
  title,
  trade,
}: {
  title: string;
  trade: { id: string; symbol: string; pnl: number | null } | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {trade ? (
          <Link
            href={`/trades/${trade.id}`}
            className="flex items-center justify-between rounded-md px-1 py-0.5 transition-colors duration-150 hover:bg-muted/40"
          >
            <span className="font-medium">{trade.symbol}</span>
            <span className={pnlColor(trade.pnl)}>
              {formatCurrency(trade.pnl, { signed: true })}
            </span>
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">No trades yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

