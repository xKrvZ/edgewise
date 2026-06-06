'use client';

import { ChartEmpty } from '@/components/shared/chart-empty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import type { AdminStatsRevenueSeriesPoint, AdminStatsUserSeriesPoint } from '@/lib/types/admin';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AdminUserSignupsChartProps {
  data: AdminStatsUserSeriesPoint[];
  isLoading: boolean;
}

export function AdminUserSignupsChart({ data, isLoading }: AdminUserSignupsChartProps) {
  const total = data.reduce((sum, point) => sum + point.count, 0);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">User signups</CardTitle>
        <p className="text-xs text-muted-foreground">
          New registrations per day
          {!isLoading && data.length > 0 && (
            <span className="ml-2 font-medium text-foreground">{formatNumber(total)} in period</span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" aria-hidden />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              aria-hidden
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDate(value)}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
                minTickGap={32}
              />
              <YAxis
                allowDecimals={false}
                tickFormatter={(value) => formatNumber(value)}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                stroke="hsl(var(--border))"
                width={40}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value) => [formatNumber(Number(value)), 'Signups'] as [string, string]}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty message="No signups in this period." height={280} />
        )}
      </CardContent>
    </Card>
  );
}

interface AdminRevenueChartProps {
  data: AdminStatsRevenueSeriesPoint[];
  isLoading: boolean;
  revenueSource?: string;
}

export function AdminRevenueChart({ data, isLoading, revenueSource }: AdminRevenueChartProps) {
  const total = data.reduce((sum, point) => sum + point.amount, 0);
  const sourceHint =
    revenueSource === 'rollup'
      ? 'Postgres billing rollups'
      : revenueSource === 'polar'
        ? 'Polar orders'
        : revenueSource === 'estimate'
          ? 'Estimated from subscriptions'
          : 'Demo data (mock billing)';

  return (
    <Card className="h-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Revenue</CardTitle>
        <p className="text-xs text-muted-foreground">
          {sourceHint}
          {!isLoading && data.length > 0 && (
            <span className="ml-2 font-medium text-foreground">
              {formatCurrency(total)} in period
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" aria-hidden />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              aria-hidden
            >
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
                  [formatCurrency(Number(value)), 'Revenue'] as [string, string]
                }
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: 'hsl(var(--primary))',
                  stroke: 'hsl(var(--card))',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty message="No revenue data in this period." height={280} />
        )}
      </CardContent>
    </Card>
  );
}
