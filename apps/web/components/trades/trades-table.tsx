'use client';

import { DirectionBadge } from '@/components/trades/direction-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime, formatR, pnlColor } from '@/lib/format';
import type { Trade } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';

type SortKey = 'entryTime' | 'symbol' | 'pnl' | 'rMultiple';
type SortDir = 'asc' | 'desc';

interface TradesTableProps {
  trades: Trade[];
  playbookNames?: Record<string, string>;
  onRowClick?: (trade: Trade) => void;
  onEdit?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
  compact?: boolean;
}

export function TradesTable({
  trades,
  playbookNames = {},
  onRowClick,
  onEdit,
  onDelete,
  compact,
}: TradesTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('entryTime');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const copy = [...trades];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'symbol':
          cmp = a.symbol.localeCompare(b.symbol);
          break;
        case 'pnl':
          cmp = (a.pnl ?? 0) - (b.pnl ?? 0);
          break;
        case 'rMultiple':
          cmp = (a.rMultiple ?? 0) - (b.rMultiple ?? 0);
          break;
        default:
          cmp = new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [trades, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'symbol' ? 'asc' : 'desc');
    }
  }

  const showActions = Boolean(onEdit || onDelete);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead onClick={() => toggleSort('symbol')}>Symbol</SortableHead>
          <TableHead>Side</TableHead>
          <SortableHead onClick={() => toggleSort('pnl')} className="text-right">
            P&L
          </SortableHead>
          <SortableHead onClick={() => toggleSort('rMultiple')} className="text-right">
            R
          </SortableHead>
          {!compact && <TableHead className="text-right">Entry</TableHead>}
          {!compact && <TableHead className="text-right">Exit</TableHead>}
          <SortableHead onClick={() => toggleSort('entryTime')}>Date</SortableHead>
          {!compact && <TableHead>Setup</TableHead>}
          {!compact && <TableHead>Tags</TableHead>}
          {showActions && <TableHead className="w-8" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((t) => (
          <TableRow
            key={t.id}
            onClick={() => onRowClick?.(t)}
            className={onRowClick ? 'cursor-pointer' : undefined}
          >
            <TableCell className="font-medium">{t.symbol}</TableCell>
            <TableCell>
              <DirectionBadge direction={t.direction} />
            </TableCell>
            <TableCell className={cn('text-right tabular-nums', pnlColor(t.pnl))}>
              {formatCurrency(t.pnl, { signed: true })}
            </TableCell>
            <TableCell className={cn('text-right tabular-nums', pnlColor(t.rMultiple))}>
              {formatR(t.rMultiple)}
            </TableCell>
            {!compact && (
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatCurrency(t.entryPrice)}
              </TableCell>
            )}
            {!compact && (
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {t.exitPrice === null ? '—' : formatCurrency(t.exitPrice)}
              </TableCell>
            )}
            <TableCell className="text-muted-foreground">{formatDateTime(t.entryTime)}</TableCell>
            {!compact && (
              <TableCell className="text-muted-foreground">
                {t.playbookId ? (playbookNames[t.playbookId] ?? '—') : '—'}
              </TableCell>
            )}
            {!compact && (
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(t.tags ?? []).slice(0, 3).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="font-normal"
                      style={
                        tag.color
                          ? { backgroundColor: `${tag.color}22`, color: tag.color }
                          : undefined
                      }
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
            )}
            {showActions && (
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && <DropdownMenuItem onClick={() => onEdit(t)}>Edit</DropdownMenuItem>}
                    {onRowClick && (
                      <DropdownMenuItem onClick={() => onRowClick(t)}>
                        View details
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => onDelete(t)}>
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SortableHead({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {children}
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      </button>
    </TableHead>
  );
}
