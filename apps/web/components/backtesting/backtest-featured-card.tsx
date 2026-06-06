'use client';

import { PnlValue } from '@/components/shared/pnl-value';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatNumber } from '@/lib/format';
import type { Backtest } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowRight, CalendarRange, Pencil, Trash2 } from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';

interface BacktestFeaturedCardProps {
  backtest: Backtest;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const MARKET_LABELS: Record<Backtest['marketType'], string> = {
  stocks: 'Stocks',
  options: 'Options',
  futures: 'Futures',
  forex: 'Forex',
  crypto: 'Crypto',
};

function periodDays(startDate: string, endDate: string): number {
  try {
    return differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1;
  } catch {
    return 0;
  }
}

export function BacktestFeaturedCard({
  backtest,
  onOpen,
  onEdit,
  onDelete,
}: BacktestFeaturedCardProps) {
  const days = periodDays(backtest.startDate, backtest.endDate);
  const hasTrades = backtest.tradeCount > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        'group mb-6 w-full cursor-pointer rounded-lg border border-border bg-card text-left',
        'transition-[border-color,box-shadow,transform] duration-150',
        'hover:-translate-y-px hover:border-primary/45 hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-primary">
              Continue replay
            </span>
            <Badge variant="outline" className="font-mono text-xs tracking-wide">
              {backtest.symbol}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {MARKET_LABELS[backtest.marketType] ?? backtest.marketType}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="truncate text-lg font-semibold tracking-tight text-foreground">
              {backtest.name}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarRange className="h-4 w-4 shrink-0" />
              <span>
                {formatDate(backtest.startDate)} – {formatDate(backtest.endDate)}
                {days > 0 && (
                  <span className="text-muted-foreground/80">
                    {' '}
                    · {formatNumber(days)}d window
                  </span>
                )}
              </span>
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            {hasTrades
              ? `${formatNumber(backtest.tradeCount)} simulated ${backtest.tradeCount === 1 ? 'trade' : 'trades'}`
              : 'No trades logged yet — open to start replaying'}
            {' · '}
            Updated {formatDate(backtest.updatedAt)}
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
          <div className="text-right">
            {hasTrades && backtest.netPnl !== null ? (
              <PnlValue value={backtest.netPnl} signed className="text-2xl font-semibold" />
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Edit backtest"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive"
              aria-label="Delete backtest"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <span className="ml-1 flex items-center gap-1 text-sm font-medium text-primary opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
              Open
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
