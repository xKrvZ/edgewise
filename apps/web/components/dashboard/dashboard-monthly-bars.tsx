'use client';

import { ChartEmpty } from '@/components/shared/chart-empty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { aggregateMonthlyPnl } from '@/lib/dashboard-metrics';
import { formatCurrency } from '@/lib/format';
import type { PnlPoint } from '@/lib/types';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DashboardMonthlyBarsProps {
  data: PnlPoint[];
  isLoading: boolean;
}

export function DashboardMonthlyBars({ data, isLoading }: DashboardMonthlyBarsProps) {
  const monthly = useMemo(() => aggregateMonthlyPnl(data), [data]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Monthly Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : monthly.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
                minTickGap={12}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, { compact: true })}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
                width={56}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value) => [formatCurrency(Number(value)), 'P&L'] as [string, string]}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {monthly.map((entry) => (
                  <Cell
                    key={entry.month}
                    fill={
                      entry.pnl >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty message="No closed trades in this period." />
        )}
      </CardContent>
    </Card>
  );
}
