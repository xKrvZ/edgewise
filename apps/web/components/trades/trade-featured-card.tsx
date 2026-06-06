'use client';

import { DirectionBadge } from '@/components/trades/direction-badge';
import { PnlValue } from '@/components/shared/pnl-value';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';
import type { Trade } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowRight, Pencil } from 'lucide-react';

interface TradeFeaturedCardProps {
  trade: Trade;
  playbookName?: string;
  onOpen: () => void;
  onEdit?: () => void;
}

export function TradeFeaturedCard({
  trade,
  playbookName,
  onOpen,
  onEdit,
}: TradeFeaturedCardProps) {
  const hasPnl = trade.pnl !== null && trade.status !== 'open';

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
        'group mb-6 w-full cursor-pointer rounded-xl border border-border bg-card text-left shadow-sm',
        'transition-[border-color,box-shadow,transform] duration-150',
        'hover:-translate-y-px hover:border-primary/45 hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-primary">
              Most recent trade
            </span>
            <Badge variant="outline" className="font-mono text-xs tracking-wide">
              {trade.symbol}
            </Badge>
            <DirectionBadge direction={trade.direction} />
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {formatDateTime(trade.entryTime)}
              {trade.exitTime && ` → ${formatDateTime(trade.exitTime)}`}
            </p>
            {playbookName && (
              <p className="text-xs text-muted-foreground">Setup: {playbookName}</p>
            )}
          </div>

          {(trade.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(trade.tags ?? []).slice(0, 4).map((tag) => (
                <Badge key={tag.id} variant="secondary" className="font-normal text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
          <div className="text-right">
            {hasPnl ? (
              <PnlValue value={trade.pnl} signed className="text-2xl font-semibold" />
            ) : (
              <span className="text-sm text-muted-foreground">
                {trade.status === 'open' ? 'Open' : '—'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit trade"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <span className="ml-1 flex items-center gap-1 text-sm font-medium text-primary opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
              View
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
