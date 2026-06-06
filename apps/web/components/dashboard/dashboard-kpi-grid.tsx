'use client';

import { DashboardChangePill } from '@/components/dashboard/dashboard-change-pill';
import {
  MiniBarChart,
  MiniProgressRing,
  MiniSparkline,
} from '@/components/dashboard/dashboard-mini-charts';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  aggregateCalendarTrades,
  aggregateCalendarWinRate,
  computePercentChange,
  profitFactorFromPnl,
  sparklineValues,
  splitByHalf,
} from '@/lib/dashboard-metrics';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatProfitFactor,
  pnlColor,
} from '@/lib/format';
import type { AnalyticsOverview, CalendarDay, EquityPoint, PnlPoint } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface DashboardKpiGridProps {
  overview: AnalyticsOverview | undefined;
  equityCurve: EquityPoint[];
  calendar: CalendarDay[];
  pnlOverTime: PnlPoint[];
  isLoading: boolean;
}

interface KpiCardProps {
  label: string;
  value: string;
  valueClassName?: string;
  change: number | null;
  chart: ReactNode;
  isLoading: boolean;
}

function KpiCard({ label, value, valueClassName, change, chart, isLoading }: KpiCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {label}
            </p>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <p
                className={cn(
                  'text-2xl font-semibold tracking-tight tabular-nums',
                  valueClassName,
                )}
              >
                {value}
              </p>
            )}
            {!isLoading && <DashboardChangePill value={change} />}
          </div>
          {isLoading ? <Skeleton className="h-10 w-20 shrink-0" /> : chart}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardKpiGrid({
  overview,
  equityCurve,
  calendar,
  pnlOverTime,
  isLoading,
}: DashboardKpiGridProps) {
  const o = overview;

  const equityValues = sparklineValues(equityCurve.map((point) => point.cumulativePnl));
  const { first: firstEquity, second: secondEquity } = splitByHalf(equityCurve);
  const netPnlChange =
    firstEquity.length > 0 && secondEquity.length > 0
      ? computePercentChange(
          secondEquity[secondEquity.length - 1]?.cumulativePnl ?? 0,
          firstEquity[firstEquity.length - 1]?.cumulativePnl ?? 0,
        )
      : null;

  const { first: firstCalendar, second: secondCalendar } = splitByHalf(calendar);
  const firstWinRate = aggregateCalendarWinRate(firstCalendar);
  const secondWinRate = aggregateCalendarWinRate(secondCalendar);
  const winRateChange =
    firstWinRate !== null && secondWinRate !== null
      ? computePercentChange(secondWinRate * 100, firstWinRate * 100)
      : null;

  const firstTrades = aggregateCalendarTrades(firstCalendar);
  const secondTrades = aggregateCalendarTrades(secondCalendar);
  const tradesChange = computePercentChange(secondTrades, firstTrades);

  const { first: firstPnl, second: secondPnl } = splitByHalf(pnlOverTime);
  const firstPf = profitFactorFromPnl(firstPnl);
  const secondPf = profitFactorFromPnl(secondPnl);
  const profitFactorChange =
    firstPf !== null && secondPf !== null
      ? computePercentChange(secondPf, firstPf)
      : null;

  const recentTradeCounts = sparklineValues(
    calendar.slice(-7).map((day) => day.trades),
    7,
  );

  const profitFactorSpark = sparklineValues(
    pnlOverTime.map((_, index, arr) => {
      const slice = arr.slice(0, index + 1);
      return profitFactorFromPnl(slice) ?? 0;
    }),
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
      <KpiCard
        label="Net P&L"
        value={formatCurrency(o?.netPnl, { signed: true })}
        valueClassName={pnlColor(o?.netPnl)}
        change={netPnlChange}
        isLoading={isLoading}
        chart={
          <MiniSparkline
            data={equityValues}
            color={
              (o?.netPnl ?? 0) >= 0
                ? 'hsl(var(--success))'
                : 'hsl(var(--destructive))'
            }
          />
        }
      />
      <KpiCard
        label="Win Rate"
        value={o ? formatPercent(o.winRate * 100) : '—'}
        valueClassName="text-foreground"
        change={winRateChange}
        isLoading={isLoading}
        chart={<MiniProgressRing value={(o?.winRate ?? 0) * 100} />}
      />
      <KpiCard
        label="Total Trades"
        value={o ? formatNumber(o.totalTrades) : '—'}
        valueClassName="text-foreground"
        change={tradesChange}
        isLoading={isLoading}
        chart={<MiniBarChart data={recentTradeCounts} />}
      />
      <KpiCard
        label="Profit Factor"
        value={formatProfitFactor(o?.profitFactor)}
        valueClassName="text-foreground"
        change={profitFactorChange}
        isLoading={isLoading}
        chart={<MiniSparkline data={profitFactorSpark} />}
      />
    </div>
  );
}
