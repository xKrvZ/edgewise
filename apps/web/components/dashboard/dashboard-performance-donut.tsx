'use client';

import { ChartEmpty } from '@/components/shared/chart-empty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatPercent } from '@/lib/format';
import type { AnalyticsOverview } from '@/lib/types';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

interface DashboardPerformanceDonutProps {
  overview: AnalyticsOverview | undefined;
  isLoading: boolean;
}

const SEGMENTS = [
  { key: 'winning', label: 'Winning Trades', color: 'hsl(var(--success))' },
  { key: 'losing', label: 'Losing Trades', color: 'hsl(var(--destructive))' },
  { key: 'breakeven', label: 'Breakeven Trades', color: 'hsl(var(--muted-foreground))' },
] as const;

export function DashboardPerformanceDonut({
  overview,
  isLoading,
}: DashboardPerformanceDonutProps) {
  const o = overview;
  const total = o?.totalTrades ?? 0;

  const chartData =
    o && total > 0
      ? [
          { name: 'Winning', value: o.winningTrades, color: SEGMENTS[0].color },
          { name: 'Losing', value: o.losingTrades, color: SEGMENTS[1].color },
          { name: 'Breakeven', value: o.breakevenTrades, color: SEGMENTS[2].color },
        ].filter((segment) => segment.value > 0)
      : [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Performance Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="mx-auto h-[240px] w-full max-w-[280px]" />
        ) : chartData.length > 0 ? (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="relative mx-auto h-[200px] w-full max-w-[200px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="68%"
                    outerRadius="100%"
                    paddingAngle={2}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular-nums">{formatNumber(total)}</span>
                <span className="text-xs text-muted-foreground">Trades</span>
              </div>
            </div>

            <ul className="min-w-0 flex-1 space-y-3">
              {SEGMENTS.map((segment) => {
                const count =
                  segment.key === 'winning'
                    ? o?.winningTrades
                    : segment.key === 'losing'
                      ? o?.losingTrades
                      : o?.breakevenTrades;
                const pct = total > 0 && count !== undefined ? (count / total) * 100 : 0;

                return (
                  <li key={segment.key} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                      <span className="truncate text-sm text-muted-foreground">{segment.label}</span>
                    </div>
                    <div className="shrink-0 text-right text-sm tabular-nums">
                      <span className="font-medium">{formatNumber(count ?? 0)}</span>
                      <span className="ml-2 text-muted-foreground">{formatPercent(pct)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <ChartEmpty message="No trades in this period." />
        )}
      </CardContent>
    </Card>
  );
}
