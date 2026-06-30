'use client';

import { PageHeader } from '@/components/app/page-header';
import { FeatureAnalyticsTracker } from '@/components/analytics/feature-analytics-tracker';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TradesEmptyState } from '@/components/trades/trades-empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ListPageSkeleton } from '@/components/shared/list-page-skeleton';
import { ListSection } from '@/components/shared/list-section';
import { PageBody } from '@/components/shared/page-body';
import { CsvImportDialog } from '@/components/trades/csv-import-dialog';
import { TradeFeaturedCard } from '@/components/trades/trade-featured-card';
import { TradeFormDialog } from '@/components/trades/trade-form-dialog';
import { TradeMetricsBar } from '@/components/trades/trade-metrics-bar';
import { TradesFilterBar } from '@/components/trades/trades-filter-bar';
import { TradesTable } from '@/components/trades/trades-table';
import { Button } from '@/components/ui/button';
import { Card, CardTableContent } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import { useReferenceData } from '@/lib/hooks/use-reference-data';
import { summarizeTrades } from '@/lib/trade-list-stats';
import { withTradeRelations } from '@/lib/trade-relations';
import type { Trade, TradeFilters } from '@/lib/types';
import { useAccountStore } from '@/stores/account-store';
import { useDateRangeStore } from '@/stores/date-range-store';
import { useTradesFilterStore } from '@/stores/trades-filter-store';
import { Plus, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function TradesPage() {
  const router = useRouter();
  const selectedAccountId = useAccountStore((s) => s.selectedAccountId);
  const from = useDateRangeStore((s) => s.from);
  const to = useDateRangeStore((s) => s.to);
  const filterStore = useTradesFilterStore();
  const { playbooks, tags, mistakes } = useReferenceData();

  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Trade | undefined>(undefined);
  const [deleting, setDeleting] = useState<Trade | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const symbol = params.get('symbol');
    const direction = params.get('direction');
    const marketType = params.get('marketType');
    const playbookId = params.get('playbookId');
    const tagId = params.get('tagId');
    if (symbol) filterStore.setSymbol(symbol);
    if (direction === 'long' || direction === 'short') filterStore.setDirection(direction);
    if (marketType) filterStore.setMarketType(marketType as never);
    if (playbookId) filterStore.setPlaybookId(playbookId);
    if (tagId) filterStore.setTagId(tagId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [cursor, setCursor] = useState<string | undefined>();

  const filters: TradeFilters = useMemo(
    () => ({
      symbol: filterStore.symbol || undefined,
      direction: filterStore.direction ?? undefined,
      marketType: filterStore.marketType ?? undefined,
      playbookId: filterStore.playbookId ?? undefined,
      tagId: filterStore.tagId ?? undefined,
      accountId: selectedAccountId ?? undefined,
      dateFrom: from ?? undefined,
      dateTo: to ?? undefined,
      cursor,
      limit: filterStore.limit,
    }),
    [
      filterStore.symbol,
      filterStore.direction,
      filterStore.marketType,
      filterStore.playbookId,
      filterStore.tagId,
      filterStore.limit,
      selectedAccountId,
      from,
      to,
      cursor,
    ],
  );

  const filterKey = JSON.stringify({
    symbol: filters.symbol,
    direction: filters.direction,
    marketType: filters.marketType,
    playbookId: filters.playbookId,
    tagId: filters.tagId,
    accountId: filters.accountId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    limit: filters.limit,
  });

  useEffect(() => {
    setCursor(undefined);
  }, [filterKey]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.symbol) params.set('symbol', filters.symbol);
    if (filters.direction) params.set('direction', filters.direction);
    if (filters.marketType) params.set('marketType', filters.marketType);
    if (filters.playbookId) params.set('playbookId', filters.playbookId);
    if (filters.tagId) params.set('tagId', filters.tagId);
    const qs = params.toString();
    window.history.replaceState(
      null,
      '',
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  }, [filters.symbol, filters.direction, filters.marketType, filters.playbookId, filters.tagId]);

  const filterKeyForQuery = JSON.stringify(filters);
  const { data, isLoading, error, refetch } = useQuery(
    () => api.trades.list(filters),
    [filterKeyForQuery],
  );

  const playbookNames = useMemo(
    () => Object.fromEntries(playbooks.map((p) => [p.id, p.name])),
    [playbooks],
  );

  const trades = useMemo(
    () => (data?.items ?? []).map((t) => withTradeRelations(t, { tags, mistakes })),
    [data, tags, mistakes],
  );
  const hasPreviousPage = Boolean(data?.previousCursor);
  const hasNextPage = Boolean(data?.nextCursor);

  const summary = useMemo(
    () =>
      summarizeTrades(trades, {
        isSinglePage: !hasPreviousPage && !hasNextPage,
      }),
    [trades, hasPreviousPage, hasNextPage],
  );
  const featuredTrade = summary.mostRecent;
  const showTable = trades.length > 1;

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }
  function openEdit(trade: Trade) {
    setEditing(trade);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api.trades.remove(deleting.id);
      toast.success('Trade deleted');
      refetch();
    } catch {
      toast.error('Failed to delete trade');
    }
  }

  return (
    <PageBody>
      <FeatureAnalyticsTracker feature="tags" action="trades_page" />
      <PageHeader
        title="Trades"
        description="Log, filter and review your executed trades."
        eyebrow="Journal"
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Log trade
            </Button>
          </>
        }
      />

      <TradesFilterBar />

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <ListPageSkeleton rows={8} />
      ) : trades.length === 0 ? (
        <TradesEmptyState onImport={() => setImportOpen(true)} onLogTrade={openCreate} />
      ) : (
        <>
          <TradeMetricsBar summary={summary} />

          {featuredTrade && (
            <TradeFeaturedCard
              trade={featuredTrade}
              playbookName={
                featuredTrade.playbookId
                  ? playbookNames[featuredTrade.playbookId]
                  : undefined
              }
              onOpen={() => router.push(`/trades/${featuredTrade.id}`)}
              onEdit={() => openEdit(featuredTrade)}
            />
          )}

          {showTable && (
            <ListSection title="All trades" countLabel={`${trades.length} on this page`}>
              <Card>
                <CardTableContent>
                  <TradesTable
                    trades={trades}
                    playbookNames={playbookNames}
                    onRowClick={(t) => router.push(`/trades/${t.id}`)}
                    onEdit={openEdit}
                    onDelete={setDeleting}
                  />
                </CardTableContent>
              </Card>
            </ListSection>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <span className="tabular-nums">
              {trades.length} trade{trades.length === 1 ? '' : 's'} on this page
            </span>
            {(hasPreviousPage || hasNextPage) && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasPreviousPage}
                  onClick={() => setCursor(data?.previousCursor ?? undefined)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNextPage}
                  onClick={() => setCursor(data?.nextCursor ?? undefined)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <TradeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        trade={editing}
        defaultAccountId={selectedAccountId}
        onSaved={() => refetch()}
      />
      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        defaultAccountId={selectedAccountId}
        onImported={() => refetch()}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Delete this trade?"
        description={
          deleting
            ? `${deleting.symbol} · ${deleting.direction} — this cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </PageBody>
  );
}
