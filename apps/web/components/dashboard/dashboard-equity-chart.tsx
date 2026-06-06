'use client';

import { ChartEmpty } from '@/components/shared/chart-empty';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { filterEquityByTimeframe, type EquityTimeframe } from '@/lib/dashboard-metrics';
import { formatCurrency, formatDate } from '@/lib/format';
import type { EquityPoint } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const TIMEFRAMES: EquityTimeframe[] = ['1D', '1W', '1M', '3M', 'ALL'];

interface DashboardEquityChartProps {
  data: EquityPoint[];
  isLoading: boolean;
}

export function DashboardEquityChart({ data, isLoading }: DashboardEquityChartProps) {
  const [timeframe, setTimeframe] = useState<EquityTimeframe>('1M');

  const filtered = useMemo(
    () => filterEquityByTimeframe(data, timeframe),
    [data, timeframe],
  );

  const latestValue = filtered[filtered.length - 1]?.cumulativePnl ?? 0;
  const stroke = latestValue >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))';

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base">Equity Curve</CardTitle>
          <p className="text-xs text-muted-foreground">
            Cumulative P&L
            {!isLoading && filtered.length > 0 && (
              <span
                className={cn(
                  'ml-2 font-medium',
                  latestValue >= 0 ? 'text-success' : 'text-destructive',
                )}
              >
                {formatCurrency(latestValue, { signed: true })}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/60 p-1">
          {TIMEFRAMES.map((frame) => (
            <Button
              key={frame}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 rounded-md px-2.5 text-xs font-medium',
                timeframe === frame
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setTimeframe(frame)}
            >
              {frame}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : filtered.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={filtered} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDate(value)}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
                minTickGap={32}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, { compact: true })}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
                width={56}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value) =>
                  [formatCurrency(Number(value)), 'Cumulative P&L'] as [string, string]
                }
              />
              <Line
                type="monotone"
                dataKey="cumulativePnl"
                stroke={stroke}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: stroke, stroke: 'hsl(var(--card))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty message="No closed trades in this period." />
        )}
      </CardContent>
    </Card>
  );
}
