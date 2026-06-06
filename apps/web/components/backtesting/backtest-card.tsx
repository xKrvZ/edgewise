'use client';

import { PnlValue } from '@/components/shared/pnl-value';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatNumber } from '@/lib/format';
import type { Backtest } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowRight, CalendarRange, Clock, Pencil, Trash2 } from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';

interface BacktestCardProps {
  backtest: Backtest;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function periodDays(startDate: string, endDate: string): number {
  try {
    return differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1;
  } catch {
    return 0;
  }
}

const MARKET_LABELS: Record<Backtest['marketType'], string> = {
  stocks: 'Stocks',
  options: 'Options',
  futures: 'Futures',
  forex: 'Forex',
  crypto: 'Crypto',
};

export function BacktestCard({ backtest, onOpen, onEdit, onDelete }: BacktestCardProps) {
  const days = periodDays(backtest.startDate, backtest.endDate);
  const hasTrades = backtest.tradeCount > 0;

  return (
    <Card
      className={cn(
        'group h-full cursor-pointer border-border bg-card',
        'transition-[border-color,box-shadow,transform] duration-150',
        'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md',
        'focus-within:ring-2 focus-within:ring-ring/60 focus-within:ring-offset-2 focus-within:ring-offset-background',
      )}
      onClick={onOpen}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <CardHeader className="gap-3 space-y-0 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-2">
            <Badge variant="outline" className="font-mono text-xs tracking-wide">
              {backtest.symbol}
            </Badge>
            <CardTitle className="truncate text-base leading-snug">{backtest.name}</CardTitle>
          </div>
          <Badge variant="secondary" className="shrink-0 capitalize">
            {MARKET_LABELS[backtest.marketType] ?? backtest.marketType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex h-[calc(100%-4.5rem)] flex-col space-y-4">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <CalendarRange className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {formatDate(backtest.startDate)} – {formatDate(backtest.endDate)}
            {days > 0 && (
              <span className="text-muted-foreground/80"> · {formatNumber(days)}d window</span>
            )}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {hasTrades
                ? `${formatNumber(backtest.tradeCount)} simulated ${backtest.tradeCount === 1 ? 'trade' : 'trades'}`
                : 'No trades logged yet'}
            </p>
            {hasTrades && backtest.netPnl !== null ? (
              <PnlValue value={backtest.netPnl} signed className="text-xl font-semibold" />
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
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'flex items-center gap-1.5 text-xs text-muted-foreground',
              !hasTrades && 'italic',
            )}
          >
            <Clock className="h-3 w-3 shrink-0" />
            Updated {formatDate(backtest.updatedAt)}
          </p>
          <span className="flex items-center gap-0.5 text-xs font-medium text-primary opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            Open
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
