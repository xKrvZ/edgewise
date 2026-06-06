'use client';

import { DirectionBadge } from '@/components/trades/direction-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTableContent, CardTitle, cardTableStatePaddingClass } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { formatCurrency, formatDate, pnlColor } from '@/lib/format';
import type { Trade } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Activity, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardRecentTradesProps {
  trades: Trade[];
  isLoading: boolean;
  onRowClick?: (trade: Trade) => void;
}

function marketLabel(marketType: Trade['marketType']): string {
  return marketType.charAt(0).toUpperCase() + marketType.slice(1);
}

function tradeResult(pnl: number | null): 'win' | 'loss' | 'breakeven' {
  if (pnl === null || pnl === 0) return 'breakeven';
  return pnl > 0 ? 'win' : 'loss';
}

function ResultBadge({ pnl }: { pnl: number | null }) {
  const result = tradeResult(pnl);
  if (result === 'win') {
    return <Badge variant="success">Win</Badge>;
  }
  if (result === 'loss') {
    return <Badge variant="destructive">Loss</Badge>;
  }
  return <Badge variant="outline">BE</Badge>;
}

export function DashboardRecentTrades({
  trades,
  isLoading,
  onRowClick,
}: DashboardRecentTradesProps) {
  return (
    <Card className="h-full gap-0">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Recent Trades</CardTitle>
        <Button variant="link" size="sm" className="h-auto px-0 text-primary" asChild>
          <Link href="/trades">View All</Link>
        </Button>
      </CardHeader>
      <CardTableContent>
        {isLoading ? (
          <div className={cn(cardTableStatePaddingClass, 'space-y-2')}>
            {Array.from({ length: 5 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton rows.
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : trades.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow
                  key={trade.id}
                  onClick={() => onRowClick?.(trade)}
                  className={cn(onRowClick && 'cursor-pointer')}
                >
                  <TableCell>
                    <div className="font-medium">{trade.symbol}</div>
                    <div className="text-xs text-muted-foreground">
                      {marketLabel(trade.marketType)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DirectionBadge direction={trade.direction} />
                  </TableCell>
                  <TableCell>
                    <ResultBadge pnl={trade.pnl} />
                  </TableCell>
                  <TableCell className={cn('text-right tabular-nums', pnlColor(trade.pnl))}>
                    {formatCurrency(trade.pnl, { signed: true })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(trade.exitTime ?? trade.entryTime)}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className={cardTableStatePaddingClass}>
            <EmptyState
              variant="embedded"
              icon={Activity}
              title="No trades logged"
              message="Once you log trades, your most recent activity shows up here."
            />
          </div>
        )}
      </CardTableContent>
    </Card>
  );
}
