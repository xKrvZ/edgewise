'use client';

import { BacktestFormDialog } from '@/components/backtesting/backtest-form-dialog';
import { DrawdownChart } from '@/components/charts/drawdown-chart';
import { EquityCurveChart } from '@/components/charts/equity-curve-chart';
import type { ChartRenderer } from '@/components/charts/market-chart';
import { ReplayViewer } from '@/components/replay/replay-viewer';
import { DirectionBadge } from '@/components/trades/direction-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api-client';
import { buildBacktestTradeMarkers } from '@/lib/backtest-markers';
import { formatCurrency, formatDate, formatPercent, formatProfitFactor, pnlColor } from '@/lib/format';
import { useCandles } from '@/lib/hooks/use-candles';
import { useGlobalFilters } from '@/lib/hooks/use-global-filters';
import { useQuery } from '@/lib/hooks/use-query';
import { useReplayEngine } from '@/lib/hooks/use-replay-engine';
import { type CandleInterval, INTERVAL_MS } from '@/lib/market-data';
import { computeTradeStats } from '@/lib/trade-stats';
import type {
  Backtest,
  BacktestAnalyticsDashboard,
  BacktestTrade,
  CreateBacktestTradeInput,
  TradeDirection,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  ArrowLeft,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Play,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useMemo, useState } from 'react';
import { toast } from 'sonner';

function pickInterval(from: number, to: number, target = 400): CandleInterval {
  const span = to - from;
  const order: CandleInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
  for (const iv of order) {
    if (span / INTERVAL_MS[iv] <= target) return iv;
  }
  return '1d';
}

function localPnl(t: BacktestTrade): number | null {
  if (t.pnl !== null && t.pnl !== undefined) return t.pnl;
  if (t.exitPrice === null || t.exitPrice === undefined) return null;
  const dir = t.direction === 'long' ? 1 : -1;
  return (t.exitPrice - t.entryPrice) * dir * t.quantity - (t.fees ?? 0);
}

interface OpenPosition {
  direction: TradeDirection;
  entryPrice: number;
  entryTime: number;
  quantity: number;
}

interface BacktestWorkspaceProps {
  backtest: Backtest;
  onBacktestUpdated?: (backtest: Backtest) => void;
}

export function BacktestWorkspace({ backtest, onBacktestUpdated }: BacktestWorkspaceProps) {
  const from = new Date(backtest.startDate).getTime();
  const to = new Date(backtest.endDate).getTime();
  const interval = useMemo(() => pickInterval(from, to), [from, to]);

  const candlesQuery = useCandles(backtest.symbol, from, to, interval);
  const candles = candlesQuery.data ?? [];
  const engine = useReplayEngine(candles.length, 400);
  const current = candles[engine.index];

  const tradesQuery = useQuery(() => api.backtests.listTrades(backtest.id), [backtest.id]);
  const analyticsQuery = useQuery(() => api.backtests.analytics(backtest.id), [backtest.id]);
  const backtestTrades = useMemo(() => tradesQuery.data ?? [], [tradesQuery.data]);
  const analytics = analyticsQuery.data;

  const globalFilters = useGlobalFilters();
  const liveOverview = useQuery(
    () => api.analytics.overview(globalFilters),
    [JSON.stringify(globalFilters)],
  );

  const [position, setPosition] = useState<OpenPosition | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [submitting, setSubmitting] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [chartRenderer, setChartRenderer] = useState<ChartRenderer>('lightweight');

  const tradesWithPnl = useMemo(
    () => backtestTrades.map((t) => ({ ...t, pnl: localPnl(t) })),
    [backtestTrades],
  );
  const localStats = useMemo(() => computeTradeStats(tradesWithPnl), [tradesWithPnl]);
  const overview = analytics?.overview;
  const displayStats = {
    netPnl: overview?.netPnl ?? localStats.netPnl,
    winRate: overview?.winRate ?? localStats.winRate,
    profitFactor: overview?.profitFactor ?? localStats.profitFactor,
    expectancy: overview?.expectancy ?? localStats.expectancy,
    closedTrades: overview?.totalTrades ?? localStats.closedTrades,
    avgR: overview?.avgR ?? null,
    maxDrawdown: overview?.maxDrawdown ?? null,
  };

  function refreshTrades() {
    tradesQuery.refetch();
    analyticsQuery.refetch();
  }

  const markers = useMemo(
    () => buildBacktestTradeMarkers(backtestTrades, candles, engine.index, position),
    [candles, engine.index, backtestTrades, position],
  );

  function enter(direction: TradeDirection) {
    if (!current) return;
    const qty = Number(quantity) || 1;
    setPosition({
      direction,
      entryPrice: current.close,
      entryTime: current.time,
      quantity: qty,
    });
    engine.pause();
    toast.success(`Entered ${direction} @ ${formatCurrency(current.close)}`);
  }

  async function close() {
    if (!position || !current) return;
    setSubmitting(true);
    const payload: CreateBacktestTradeInput = {
      symbol: backtest.symbol,
      direction: position.direction,
      entryPrice: position.entryPrice,
      exitPrice: current.close,
      quantity: position.quantity,
      entryTime: new Date(position.entryTime).toISOString(),
      exitTime: new Date(current.time).toISOString(),
      fees: 0,
    };
    try {
      await api.backtests.addTrade(backtest.id, payload);
      toast.success('Backtest trade recorded');
      setPosition(null);
      refreshTrades();
    } catch {
      toast.error('Could not record trade (backend offline?)');
    } finally {
      setSubmitting(false);
    }
  }

  async function removeTrade(tradeId: string) {
    try {
      await api.backtests.removeTrade(backtest.id, tradeId);
      refreshTrades();
    } catch {
      toast.error('Could not remove trade');
    }
  }

  const openPnl =
    position && current
      ? (current.close - position.entryPrice) *
        (position.direction === 'long' ? 1 : -1) *
        position.quantity
      : null;

  const isLoading = candlesQuery.isLoading;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-card/50 px-2 py-1.5 sm:gap-3 sm:px-3 sm:py-2">
        <Link
          href="/backtesting"
          className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Backtests</span>
        </Link>

        <div className="flex min-w-0 items-center gap-2 border-l border-border pl-2 sm:pl-3">
          <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
            {backtest.name}
          </span>
          <span className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:text-xs">
            {backtest.symbol}
          </span>
          <span className="hidden shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline sm:text-xs">
            {interval}
          </span>
          <span className="hidden text-xs text-muted-foreground lg:inline">
            {formatDate(backtest.startDate)} – {formatDate(backtest.endDate)}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden items-center gap-2 text-xs tabular-nums sm:flex">
            <span className={cn('font-medium', pnlColor(displayStats.netPnl))}>
              {formatCurrency(displayStats.netPnl, { signed: true })}
            </span>
            <span className="text-muted-foreground">
              {displayStats.closedTrades} trade{displayStats.closedTrades === 1 ? '' : 's'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setFormOpen(true)}
            aria-label="Edit backtest"
            title="Edit backtest"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden lg:inline-flex"
            onClick={() => setPanelOpen((open) => !open)}
            aria-label={panelOpen ? 'Hide side panel' : 'Show side panel'}
            title={panelOpen ? 'Hide panel' : 'Show panel'}
          >
            {panelOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="lg:hidden"
                aria-label="Open backtest panel"
              >
                <PanelRightOpen className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-sm">
              <SheetHeader className="border-b border-border px-4 py-3">
                <SheetTitle>Backtest panel</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto p-4">
                <BacktestSidePanel
                  backtest={backtest}
                  interval={interval}
                  quantity={quantity}
                  setQuantity={setQuantity}
                  position={position}
                  openPnl={openPnl}
                  submitting={submitting}
                  current={current}
                  onEnter={enter}
                  onClose={close}
                  stats={displayStats}
                  analytics={analytics}
                  analyticsLoading={analyticsQuery.isLoading}
                  liveOverview={liveOverview.data}
                  tradesWithPnl={tradesWithPnl}
                  tradesLoading={tradesQuery.isLoading}
                  onRemoveTrade={removeTrade}
                  chartRenderer={chartRenderer}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-background">
          {isLoading ? (
            <Skeleton className="m-0 h-full w-full rounded-none" />
          ) : candles.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-sm font-medium">No market data for this window</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Check that the API is running and the symbol/date range has simulated candles.
              </p>
            </div>
          ) : (
            <ReplayViewer
              symbol={backtest.symbol}
              interval={interval}
              candles={candles}
              markers={markers}
              fill
              controlsVariant="dock"
              className="h-full"
              engine={engine}
              onChartRendererResolved={setChartRenderer}
            />
          )}
        </section>

        {panelOpen && (
          <aside className="hidden w-80 shrink-0 flex-col border-l border-border bg-card/30 lg:flex xl:w-96">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Backtest
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setPanelOpen(false)}
                aria-label="Close side panel"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <BacktestSidePanel
                backtest={backtest}
                interval={interval}
                quantity={quantity}
                setQuantity={setQuantity}
                position={position}
                openPnl={openPnl}
                submitting={submitting}
                current={current}
                onEnter={enter}
                onClose={close}
                stats={displayStats}
                analytics={analytics}
                analyticsLoading={analyticsQuery.isLoading}
                liveOverview={liveOverview.data}
                tradesWithPnl={tradesWithPnl}
                tradesLoading={tradesQuery.isLoading}
                onRemoveTrade={removeTrade}
                chartRenderer={chartRenderer}
              />
            </div>
          </aside>
        )}
      </div>

      <BacktestFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        backtest={backtest}
        onSaved={(b) => onBacktestUpdated?.(b)}
      />
    </div>
  );
}

interface BacktestSidePanelProps {
  backtest: Backtest;
  interval: CandleInterval;
  quantity: string;
  setQuantity: (value: string) => void;
  position: OpenPosition | null;
  openPnl: number | null;
  submitting: boolean;
  current: { close: number; time: number } | undefined;
  onEnter: (direction: TradeDirection) => void;
  onClose: () => void;
  stats: {
    netPnl: number;
    winRate: number;
    profitFactor: number | null;
    expectancy: number;
    closedTrades: number;
    avgR: number | null;
    maxDrawdown: number | null;
  };
  analytics: BacktestAnalyticsDashboard | undefined;
  analyticsLoading: boolean;
  liveOverview: Awaited<ReturnType<typeof api.analytics.overview>> | undefined;
  tradesWithPnl: Array<BacktestTrade & { pnl: number | null }>;
  tradesLoading: boolean;
  onRemoveTrade: (tradeId: string) => void;
  chartRenderer: ChartRenderer;
}

function BacktestSidePanel({
  backtest,
  interval,
  quantity,
  setQuantity,
  position,
  openPnl,
  submitting,
  current,
  onEnter,
  onClose,
  stats,
  analytics,
  analyticsLoading,
  liveOverview,
  tradesWithPnl,
  tradesLoading,
  onRemoveTrade,
  chartRenderer,
}: BacktestSidePanelProps) {
  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-lg border border-border bg-background/60 p-3">
        <h2 className="text-sm font-medium">Setup</h2>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            {backtest.symbol} · {interval}
          </p>
          <p>
            {formatDate(backtest.startDate)} – {formatDate(backtest.endDate)}
          </p>
          {backtest.notes && <p className="pt-1 text-foreground/80">{backtest.notes}</p>}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Play className="h-3 w-3" />
          {chartRenderer === 'tradingview'
            ? 'TradingView Advanced Charts · indicators & drawings enabled.'
            : 'Lightweight Charts fallback · add charting_library for full TV features.'}
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-background/60 p-3">
        <h2 className="text-sm font-medium">Order entry</h2>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Quantity</Label>
          <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        {position ? (
          <div className="space-y-2 rounded-md border bg-card/50 p-3 text-sm">
            <div className="flex items-center justify-between">
              <DirectionBadge direction={position.direction} />
              <span className="tabular-nums">
                {position.quantity} @ {formatCurrency(position.entryPrice)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Open P&L</span>
              <span className={pnlColor(openPnl)}>
                {formatCurrency(openPnl, { signed: true })}
              </span>
            </div>
            <Button className="w-full" onClick={onClose} disabled={submitting}>
              Close position
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => onEnter('long')} disabled={!current} className="bg-primary">
              Buy / Long
            </Button>
            <Button onClick={() => onEnter('short')} disabled={!current} variant="destructive">
              Sell / Short
            </Button>
          </div>
        )}
        {current && (
          <p className="text-center text-xs text-muted-foreground tabular-nums">
            {format(new Date(current.time), 'MMM d HH:mm')} · Close{' '}
            {formatCurrency(current.close)}
          </p>
        )}
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-background/60 p-3">
        <h2 className="text-sm font-medium">Results</h2>
        {analyticsLoading && !analytics ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <>
            <SummaryRow label="Net P&L">
              <span className={pnlColor(stats.netPnl)}>
                {formatCurrency(stats.netPnl, { signed: true })}
              </span>
            </SummaryRow>
            <SummaryRow label="Win rate">{formatPercent(stats.winRate)}</SummaryRow>
            <SummaryRow label="Profit factor">{formatProfitFactor(stats.profitFactor)}</SummaryRow>
            <SummaryRow label="Expectancy">
              {formatCurrency(stats.expectancy, { signed: true })}
            </SummaryRow>
            <SummaryRow label="Avg R">
              {stats.avgR !== null ? stats.avgR.toFixed(2) : '—'}
            </SummaryRow>
            <SummaryRow label="Max drawdown">
              {stats.maxDrawdown !== null
                ? formatCurrency(stats.maxDrawdown, { signed: true })
                : '—'}
            </SummaryRow>
            <SummaryRow label="Trades">{String(stats.closedTrades)}</SummaryRow>
          </>
        )}
      </section>

      {analytics && analytics.equityCurve.length > 0 && (
        <section className="space-y-2 rounded-lg border border-border bg-background/60 p-3">
          <h2 className="text-sm font-medium">Equity curve</h2>
          <EquityCurveChart data={analytics.equityCurve} height={140} />
        </section>
      )}

      {analytics && analytics.drawdown.length > 0 && (
        <section className="space-y-2 rounded-lg border border-border bg-background/60 p-3">
          <h2 className="text-sm font-medium">Drawdown</h2>
          <DrawdownChart data={analytics.drawdown} height={120} />
        </section>
      )}

      <section className="space-y-2 rounded-lg border border-border bg-background/60 p-3">
        <h2 className="text-sm font-medium">Backtest vs live</h2>
        <CompareRow
          label="Net P&L"
          backtest={formatCurrency(stats.netPnl, { signed: true })}
          live={formatCurrency(liveOverview?.netPnl, { signed: true })}
        />
        <CompareRow
          label="Win rate"
          backtest={formatPercent(stats.winRate)}
          live={formatPercent(liveOverview?.winRate)}
        />
        <CompareRow
          label="Profit factor"
          backtest={formatProfitFactor(stats.profitFactor)}
          live={formatProfitFactor(liveOverview?.profitFactor)}
        />
        <CompareRow
          label="Trades"
          backtest={String(stats.closedTrades)}
          live={String(liveOverview?.totalTrades ?? '—')}
        />
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-background/60 p-3">
        <h2 className="text-sm font-medium">Recorded trades</h2>
        {tradesLoading ? (
          <div className="space-y-2">
            {(['a', 'b', 'c'] as const).map((key) => (
              <Skeleton key={key} className="h-8 w-full" />
            ))}
          </div>
        ) : tradesWithPnl.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Press play, then enter and exit positions as price develops.
          </p>
        ) : (
          <div className="max-h-48 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8">Side</TableHead>
                  <TableHead className="h-8 text-right">P&L</TableHead>
                  <TableHead className="h-8 w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tradesWithPnl.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="py-1.5">
                      <DirectionBadge direction={t.direction} />
                    </TableCell>
                    <TableCell className={cn('py-1.5 text-right tabular-nums', pnlColor(t.pnl))}>
                      {formatCurrency(t.pnl, { signed: true })}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <button
                        type="button"
                        onClick={() => onRemoveTrade(t.id)}
                        className="text-destructive hover:opacity-70"
                        aria-label="Remove trade"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <p className="text-[11px] text-muted-foreground">
        Space to play/pause · ← → to step · Home to reset
      </p>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{children}</span>
    </div>
  );
}

function CompareRow({
  label,
  backtest,
  live,
}: {
  label: string;
  backtest: string;
  live: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex gap-3 tabular-nums">
        <span className="font-medium">{backtest}</span>
        <span className="text-muted-foreground">{live}</span>
      </div>
    </div>
  );
}
