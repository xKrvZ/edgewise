'use client';

import type { ChartMarker } from '@/components/replay/candlestick-chart';
import type { ChartRenderer } from '@/components/charts/market-chart';
import { ReplayViewer } from '@/components/replay/replay-viewer';
import { DirectionBadge } from '@/components/trades/direction-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api-client';
import { formatCurrency, formatR, pnlColor } from '@/lib/format';
import { computeMaeMfe } from '@/lib/replay-stats';
import { deriveTradeWindow, useCandles } from '@/lib/hooks/use-candles';
import { useQuery } from '@/lib/hooks/use-query';
import { CANDLE_INTERVALS, type CandleInterval } from '@/lib/market-data';
import type { Trade } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PanelRightClose, PanelRightOpen, Play, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

export default function ReplayPage() {
  const [tradeId, setTradeId] = useState<string | null>(null);
  const [symbol, setSymbol] = useState('AAPL');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [interval, setInterval] = useState<CandleInterval>('5m');
  const [notes, setNotes] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);
  const [chartRenderer, setChartRenderer] = useState<ChartRenderer>('lightweight');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tradeId');
    if (t) setTradeId(t);
  }, []);

  const tradeQuery = useQuery(() => api.trades.get(tradeId as string), [tradeId], {
    enabled: Boolean(tradeId),
  });
  const trade = tradeQuery.data;

  useEffect(() => {
    if (trade) {
      setSymbol(trade.symbol);
      setNotes(trade.notes ?? '');
    }
  }, [trade]);

  const range = useMemo(() => {
    if (trade) return deriveTradeWindow(trade.entryTime, trade.exitTime);
    const start = new Date(`${date}T09:30:00`).getTime();
    const end = new Date(`${date}T16:00:00`).getTime();
    return { from: start, to: end, interval };
  }, [trade, date, interval]);

  const candlesQuery = useCandles(symbol, range.from, range.to, range.interval);
  const candles = candlesQuery.data ?? [];
  const isLoading = candlesQuery.isLoading || tradeQuery.isLoading;

  const maeMfe = useMemo(() => {
    if (!trade || candles.length === 0) return null;
    return computeMaeMfe(trade, candles);
  }, [trade, candles]);

  const markers: ChartMarker[] = useMemo(() => {
    if (!trade) return [];
    const m: ChartMarker[] = [
      {
        time: new Date(trade.entryTime).getTime(),
        price: trade.entryPrice,
        kind: 'entry',
        label: `Entry ${formatCurrency(trade.entryPrice)}`,
      },
    ];
    if (trade.exitPrice !== null)
      m.push({
        time: new Date(trade.exitTime ?? trade.entryTime).getTime(),
        price: trade.exitPrice,
        kind: 'exit',
        label: `Exit ${formatCurrency(trade.exitPrice)}`,
      });
    if (trade.stopLoss !== null)
      m.push({ time: 0, price: trade.stopLoss, kind: 'stop', label: 'Stop' });
    if (trade.takeProfit !== null)
      m.push({
        time: 0,
        price: trade.takeProfit,
        kind: 'target',
        label: 'Target',
      });
    return m;
  }, [trade]);

  function clearTradeReplay() {
    setTradeId(null);
    globalThis.history?.replaceState(null, '', '/replay');
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-card/80 px-2 py-1.5 backdrop-blur-sm sm:gap-3 sm:px-3 sm:py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
            {symbol}
          </span>
          <span className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:text-xs">
            {range.interval}
          </span>
          {trade && <DirectionBadge direction={trade.direction} />}
        </div>

        {trade && (
          <div className="hidden items-center gap-3 text-xs tabular-nums sm:flex">
            <span className={cn('font-medium', pnlColor(trade.pnl))}>
              {formatCurrency(trade.pnl, { signed: true })}
            </span>
            <span className={cn('text-muted-foreground', pnlColor(trade.rMultiple))}>
              {formatR(trade.rMultiple)}
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {tradeId && (
            <Button
              variant="ghost"
              size="xs"
              className="hidden sm:inline-flex"
              onClick={clearTradeReplay}
            >
              Replay a day
            </Button>
          )}
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
                aria-label="Open context panel"
              >
                <PanelRightOpen className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-sm">
              <SheetHeader className="border-b border-border px-4 py-3">
                <SheetTitle>Replay context</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto p-4">
                <ReplaySidePanel
                  tradeId={tradeId}
                  trade={trade}
                  symbol={symbol}
                  setSymbol={setSymbol}
                  date={date}
                  setDate={setDate}
                  interval={interval}
                  setInterval={setInterval}
                  notes={notes}
                  setNotes={setNotes}
                  onClearTrade={clearTradeReplay}
                  chartRenderer={chartRenderer}
                  maeMfe={maeMfe}
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
          ) : (
            <ReplayViewer
              symbol={symbol}
              interval={range.interval}
              candles={candles}
              markers={markers}
              fill
              controlsVariant="dock"
              className="h-full"
              onChartRendererResolved={setChartRenderer}
            />
          )}
        </section>

        {panelOpen && (
          <aside className="hidden w-72 shrink-0 flex-col border-l border-border bg-card/30 lg:flex">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Context
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
              <ReplaySidePanel
                tradeId={tradeId}
                trade={trade}
                symbol={symbol}
                setSymbol={setSymbol}
                date={date}
                setDate={setDate}
                interval={interval}
                setInterval={setInterval}
                notes={notes}
                setNotes={setNotes}
                onClearTrade={clearTradeReplay}
                chartRenderer={chartRenderer}
                maeMfe={maeMfe}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

interface ReplaySidePanelProps {
  tradeId: string | null;
  trade: Trade | undefined;
  symbol: string;
  setSymbol: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
  interval: CandleInterval;
  setInterval: (value: CandleInterval) => void;
  notes: string;
  setNotes: (value: string) => void;
  onClearTrade: () => void;
  chartRenderer: ChartRenderer;
  maeMfe: { mae: number; mfe: number } | null;
}

function ReplaySidePanel({
  tradeId,
  trade,
  symbol,
  setSymbol,
  date,
  setDate,
  interval,
  setInterval,
  notes,
  setNotes,
  onClearTrade,
  chartRenderer,
  maeMfe,
}: ReplaySidePanelProps) {
  return (
    <div className="space-y-4">
      {!tradeId && (
        <section className="space-y-3 rounded-lg border border-border bg-background/60 p-3">
          <h2 className="text-sm font-medium">Setup</h2>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Symbol</Label>
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Interval</Label>
            <Select value={interval} onValueChange={(v) => setInterval(v as CandleInterval)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANDLE_INTERVALS.map((iv) => (
                  <SelectItem key={iv} value={iv}>
                    {iv}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Play className="h-3 w-3" />
            {chartRenderer === 'tradingview'
              ? 'TradingView Advanced Charts · indicators & drawings enabled.'
              : 'Lightweight Charts fallback · add charting_library for full TV features.'}
          </p>
        </section>
      )}

      {trade && (
        <section className="space-y-2 rounded-lg border border-border bg-background/60 p-3 text-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Trade summary</h2>
            {tradeId && (
              <Button variant="ghost" size="xs" onClick={onClearTrade}>
                Clear
              </Button>
            )}
          </div>
          <SummaryRow label="Net P&L">
            <span className={pnlColor(trade.pnl)}>
              {formatCurrency(trade.pnl, { signed: true })}
            </span>
          </SummaryRow>
          <SummaryRow label="R-multiple">
            <span className={pnlColor(trade.rMultiple)}>{formatR(trade.rMultiple)}</span>
          </SummaryRow>
          <SummaryRow label="Entry">{formatCurrency(trade.entryPrice)}</SummaryRow>
          <SummaryRow label="Exit">
            {trade.exitPrice === null ? '—' : formatCurrency(trade.exitPrice)}
          </SummaryRow>
          <SummaryRow label="Fees">{formatCurrency(trade.fees)}</SummaryRow>
          {maeMfe && (
            <>
              <SummaryRow label="MAE (est.)">
                <span className="text-destructive">
                  {formatCurrency(maeMfe.mae, { signed: true })}
                </span>
              </SummaryRow>
              <SummaryRow label="MFE (est.)">
                <span className="text-success">
                  {formatCurrency(maeMfe.mfe, { signed: true })}
                </span>
              </SummaryRow>
            </>
          )}
        </section>
      )}

      <section className="space-y-2 rounded-lg border border-border bg-background/60 p-3">
        <h2 className="text-sm font-medium">Notes</h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What do you notice as price develops?"
          rows={6}
          className="min-h-[120px] resize-y"
        />
      </section>

      <p className="text-[11px] text-muted-foreground">
        Space to play/pause · ← → to step · Home to reset
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{children}</span>
    </div>
  );
}
