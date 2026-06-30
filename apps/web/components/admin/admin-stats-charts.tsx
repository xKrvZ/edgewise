'use client';

import { ChartEmpty } from '@/components/shared/chart-empty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@/lib/format';
import type {
  AdminStatsActivationTrendPoint,
  AdminStatsMetricsSeriesPoint,
  AdminStatsRevenueSeriesPoint,
  AdminStatsUserSeriesPoint,
} from '@/lib/types/admin';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const CHART_TOOLTIP_STYLE = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
  color: 'hsl(var(--popover-foreground))',
};

const AXIS_TICK = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' };

interface AdminCountChartProps {
  data: AdminStatsUserSeriesPoint[];
  isLoading: boolean;
  title: string;
  description: string;
  emptyMessage: string;
  dataKey?: string;
  label?: string;
  variant?: 'bar' | 'line';
  color?: string;
}

function AdminCountChart({
  data,
  isLoading,
  title,
  description,
  emptyMessage,
  dataKey = 'count',
  label = 'Count',
  variant = 'bar',
  color = 'hsl(var(--primary))',
}: AdminCountChartProps) {
  const total = data.reduce((sum, point) => sum + point.count, 0);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {description}
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
            {variant === 'line' ? (
              <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} aria-hidden>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => formatDate(value)}
                  tick={AXIS_TICK}
                  stroke="hsl(var(--border))"
                  minTickGap={32}
                />
                <YAxis
                  allowDecimals={false}
                  tickFormatter={(value) => formatNumber(value)}
                  tick={AXIS_TICK}
                  stroke="hsl(var(--border))"
                  width={40}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value) => [formatNumber(Number(value)), label] as [string, string]}
                />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: color,
                    stroke: 'hsl(var(--card))',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} aria-hidden>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => formatDate(value)}
                  tick={AXIS_TICK}
                  stroke="hsl(var(--border))"
                  minTickGap={32}
                />
                <YAxis
                  allowDecimals={false}
                  tickFormatter={(value) => formatNumber(value)}
                  tick={AXIS_TICK}
                  stroke="hsl(var(--border))"
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value) => [formatNumber(Number(value)), label] as [string, string]}
                />
                <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <ChartEmpty message={emptyMessage} height={280} />
        )}
      </CardContent>
    </Card>
  );
}

interface AdminUserSignupsChartProps {
  data: AdminStatsUserSeriesPoint[];
  isLoading: boolean;
  emptyMessage?: string;
}

export function AdminUserSignupsChart({
  data,
  isLoading,
  emptyMessage = 'No signups in this period.',
}: AdminUserSignupsChartProps) {
  return (
    <AdminCountChart
      data={data}
      isLoading={isLoading}
      title="User signups"
      description="New registrations per day"
      emptyMessage={emptyMessage}
      label="Signups"
    />
  );
}

interface AdminSubscriptionsChartProps {
  data: AdminStatsUserSeriesPoint[];
  isLoading: boolean;
  title?: string;
  description?: string;
  emptyMessage?: string;
}

export function AdminSubscriptionsChart({
  data,
  isLoading,
  title = 'New subscriptions',
  description = 'Active subscriptions started per day',
  emptyMessage = 'No new subscriptions in this period.',
}: AdminSubscriptionsChartProps) {
  return (
    <AdminCountChart
      data={data}
      isLoading={isLoading}
      title={title}
      description={description}
      emptyMessage={emptyMessage}
      label="Subscriptions"
      variant="line"
      color="hsl(var(--chart-2, var(--primary)))"
    />
  );
}

interface AdminCancellationsChartProps {
  data: AdminStatsUserSeriesPoint[];
  isLoading: boolean;
}

export function AdminCancellationsChart({ data, isLoading }: AdminCancellationsChartProps) {
  return (
    <AdminCountChart
      data={data}
      isLoading={isLoading}
      title="Cancellations"
      description="Subscriptions canceled per day"
      emptyMessage="No cancellations in this period."
      label="Cancellations"
      variant="bar"
      color="hsl(var(--destructive))"
    />
  );
}

interface AdminActivationActivityChartProps {
  data: AdminStatsMetricsSeriesPoint[];
  isLoading: boolean;
  emptyMessage?: string;
}

export function AdminActivationActivityChart({
  data,
  isLoading,
  emptyMessage = 'No activation activity in this period.',
}: AdminActivationActivityChartProps) {
  const chartData = data.map((point) => ({
    date: point.date,
    journals: point.journals,
    trades: point.trades,
    communityJoins: point.communityJoins,
  }));

  return (
    <Card className="h-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Activation activity</CardTitle>
        <p className="text-xs text-muted-foreground">
          Journals created, trades logged, and community joins per day
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" aria-hidden />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} aria-hidden>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDate(value)}
                tick={AXIS_TICK}
                stroke="hsl(var(--border))"
                minTickGap={32}
              />
              <YAxis
                allowDecimals={false}
                tickFormatter={(value) => formatNumber(value)}
                tick={AXIS_TICK}
                stroke="hsl(var(--border))"
                width={40}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value, name) => [formatNumber(Number(value)), String(name)] as [string, string]}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }} />
              <Line
                type="monotone"
                dataKey="journals"
                name="Journals"
                stroke="hsl(var(--chart-1, var(--primary)))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="trades"
                name="Trades logged"
                stroke="hsl(var(--chart-2, var(--primary)))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="communityJoins"
                name="Community joins"
                stroke="hsl(var(--chart-3, var(--primary)))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty message={emptyMessage} height={280} />
        )}
      </CardContent>
    </Card>
  );
}

interface AdminActivationTrendChartProps {
  data: AdminStatsActivationTrendPoint[];
  isLoading: boolean;
  emptyMessage?: string;
}

function stepConversionRate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }

  return Number(((numerator / denominator) * 100).toFixed(1));
}

const ACTIVATION_TREND_SERIES = [
  {
    dataKey: 'journalRate' as const,
    label: 'Signup → journal',
    color: 'hsl(var(--chart-1))',
  },
  {
    dataKey: 'tradeRate' as const,
    label: 'Signup → first trade',
    color: 'hsl(var(--chart-2))',
  },
  {
    dataKey: 'subscriptionRate' as const,
    label: 'Signup → subscription',
    color: 'hsl(var(--chart-3))',
  },
] as const;

function ActivationTrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: AdminStatsActivationTrendPoint }[];
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;
  const journalFromSignup = stepConversionRate(point.journalsCreated, point.signups);
  const tradeFromJournal = stepConversionRate(point.firstTrades, point.journalsCreated);
  const communityFromTrade = stepConversionRate(point.communityJoins, point.firstTrades);
  const subscriptionFromCommunity = stepConversionRate(point.subscriptions, point.communityJoins);

  const rows = [
    {
      label: 'Signups',
      count: point.signups,
      rate: null as number | null,
      rateLabel: null as string | null,
      color: null as string | null,
    },
    {
      label: 'Journal created',
      count: point.journalsCreated,
      rate: journalFromSignup,
      rateLabel: 'of signups',
      color: ACTIVATION_TREND_SERIES[0].color,
    },
    {
      label: 'First trade',
      count: point.firstTrades,
      rate: tradeFromJournal,
      rateLabel: 'from journal',
      color: ACTIVATION_TREND_SERIES[1].color,
    },
    {
      label: 'Community join',
      count: point.communityJoins,
      rate: communityFromTrade,
      rateLabel: 'from trade',
      color: 'hsl(var(--chart-4))',
    },
    {
      label: 'Subscription',
      count: point.subscriptions,
      rate: subscriptionFromCommunity,
      rateLabel: 'from community',
      color: ACTIVATION_TREND_SERIES[2].color,
    },
  ];

  return (
    <div
      className="rounded-lg border border-border bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-md"
      style={{ minWidth: 240 }}
    >
      <p className="mb-2.5 border-b border-border/60 pb-2 font-medium">
        Week of {formatDate(label as string)}
      </p>
      <dl className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4">
            <dt className="flex items-center gap-2 text-muted-foreground">
              {row.color ? (
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                  aria-hidden
                />
              ) : null}
              {row.label}
            </dt>
            <dd className="text-right font-medium tabular-nums">
              {formatNumber(row.count)}
              {row.rate !== null && row.rateLabel ? (
                <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                  {formatPercent(row.rate)} {row.rateLabel}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ActivationTrendLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {ACTIVATION_TREND_SERIES.map((series) => (
        <div key={series.dataKey} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="h-0.5 w-4 shrink-0 rounded-full"
            style={{ backgroundColor: series.color }}
            aria-hidden
          />
          <span>{series.label}</span>
        </div>
      ))}
    </div>
  );
}

export function AdminActivationTrendChart({
  data,
  isLoading,
  emptyMessage = 'Not enough data for weekly activation trends.',
}: AdminActivationTrendChartProps) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-2">
        <CardTitle className="text-base">Weekly activation drop-off</CardTitle>
        <p className="text-xs text-muted-foreground">
          Each line shows what share of that week&apos;s signups reached a milestone. Hover for
          counts and step-to-step conversion.
        </p>
        {!isLoading && data.length > 0 ? <ActivationTrendLegend /> : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" aria-hidden />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 12, right: 16, left: 4, bottom: 20 }}
              aria-hidden
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="weekStart"
                tickFormatter={(value) => formatDate(value)}
                tick={AXIS_TICK}
                stroke="hsl(var(--border))"
                minTickGap={28}
                dy={8}
              >
                <Label
                  value="Week"
                  offset={-2}
                  position="insideBottom"
                  style={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
              </XAxis>
              <YAxis
                tickFormatter={(value) => formatPercent(Number(value), 0)}
                tick={AXIS_TICK}
                stroke="hsl(var(--border))"
                width={52}
                domain={[0, 'auto']}
              >
                <Label
                  value="% of signups"
                  angle={-90}
                  position="insideLeft"
                  style={{
                    fontSize: 11,
                    fill: 'hsl(var(--muted-foreground))',
                    textAnchor: 'middle',
                  }}
                />
              </YAxis>
              <Tooltip content={<ActivationTrendTooltip />} />
              {ACTIVATION_TREND_SERIES.map((series) => (
                <Line
                  key={series.dataKey}
                  type="monotone"
                  dataKey={series.dataKey}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: series.color,
                    stroke: 'hsl(var(--card))',
                    strokeWidth: 2,
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty message={emptyMessage} height={300} />
        )}
      </CardContent>
    </Card>
  );
}

interface AdminConversionEventsChartProps {
  checkoutData: AdminStatsUserSeriesPoint[];
  subscriptionData: AdminStatsUserSeriesPoint[];
  isLoading: boolean;
  emptyMessage?: string;
}

export function AdminConversionEventsChart({
  checkoutData,
  subscriptionData,
  isLoading,
  emptyMessage = 'No conversion events in this period.',
}: AdminConversionEventsChartProps) {
  const dateSet = new Set([
    ...checkoutData.map((point) => point.date),
    ...subscriptionData.map((point) => point.date),
  ]);
  const chartData = [...dateSet]
    .sort()
    .map((date) => ({
      date,
      checkoutStarted:
        checkoutData.find((point) => point.date === date)?.count ?? 0,
      subscriptionsCompleted:
        subscriptionData.find((point) => point.date === date)?.count ?? 0,
    }));

  const totalCheckout = checkoutData.reduce((sum, point) => sum + point.count, 0);
  const totalSubscriptions = subscriptionData.reduce((sum, point) => sum + point.count, 0);
  const hasData = totalCheckout > 0 || totalSubscriptions > 0;

  return (
    <Card className="h-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Conversion events</CardTitle>
        <p className="text-xs text-muted-foreground">
          checkout_started and subscription_completed from PostHog. Dollar revenue is not tracked —
          use Polar or billing rollups on the dashboard for revenue.
          {!isLoading && hasData ? (
            <span className="ml-2 font-medium text-foreground">
              {formatNumber(totalCheckout)} checkouts · {formatNumber(totalSubscriptions)}{' '}
              completions in period
            </span>
          ) : null}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" aria-hidden />
        ) : hasData ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} aria-hidden>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDate(value)}
                tick={AXIS_TICK}
                stroke="hsl(var(--border))"
                minTickGap={32}
              />
              <YAxis
                allowDecimals={false}
                tickFormatter={(value) => formatNumber(value)}
                tick={AXIS_TICK}
                stroke="hsl(var(--border))"
                width={40}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value, name) => [formatNumber(Number(value)), String(name)] as [string, string]}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }} />
              <Line
                type="monotone"
                dataKey="checkoutStarted"
                name="Checkout started"
                stroke="hsl(var(--chart-4, var(--primary)))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="subscriptionsCompleted"
                name="Subscription completed"
                stroke="hsl(var(--chart-2, var(--primary)))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty message={emptyMessage} height={280} />
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
            <AreaChart
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
                contentStyle={CHART_TOOLTIP_STYLE}
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value) =>
                  [formatCurrency(Number(value)), 'Revenue'] as [string, string]
                }
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.15}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: 'hsl(var(--primary))',
                  stroke: 'hsl(var(--card))',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty message="No revenue data in this period." height={280} />
        )}
      </CardContent>
    </Card>
  );
}
