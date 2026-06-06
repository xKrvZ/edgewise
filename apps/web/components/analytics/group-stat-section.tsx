'use client';

import { GroupBarChart } from '@/components/charts/group-bar-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatPercent, formatProfitFactor, formatR, pnlColor } from '@/lib/format';
import type { GroupStat } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GroupStatSectionProps {
  title: string;
  description?: string;
  data: GroupStat[] | undefined;
  isLoading: boolean;
  /** Hide the chart and only show the table (for many-row groupings). */
  tableOnly?: boolean;
}

export function GroupStatSection({
  title,
  description,
  data,
  isLoading,
  tableOnly,
}: GroupStatSectionProps) {
  const rows = data ?? [];
  const chartData = [...rows].sort((a, b) => b.netPnl - a.netPnl).slice(0, 12);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No data for this breakdown yet.
          </p>
        ) : (
          <>
            {!tableOnly && <GroupBarChart data={chartData} />}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-right">Trades</TableHead>
                  <TableHead className="text-right">Net P&L</TableHead>
                  <TableHead className="text-right">Win %</TableHead>
                  <TableHead className="text-right">PF</TableHead>
                  <TableHead className="text-right">Avg R</TableHead>
                  <TableHead className="text-right">Expectancy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.trades}</TableCell>
                    <TableCell className={cn('text-right tabular-nums', pnlColor(r.netPnl))}>
                      {formatCurrency(r.netPnl, { signed: true })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPercent(r.winRate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatProfitFactor(r.profitFactor)}
                    </TableCell>
                    <TableCell className={cn('text-right tabular-nums', pnlColor(r.avgR))}>
                      {formatR(r.avgR)}
                    </TableCell>
                    <TableCell className={cn('text-right tabular-nums', pnlColor(r.expectancy))}>
                      {formatCurrency(r.expectancy, { signed: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
