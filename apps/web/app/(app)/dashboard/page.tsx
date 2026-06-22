'use client';

import { PeriodAiReviewCard } from '@/components/ai-review/period-ai-review-card';
import { CreateAccountCta } from '@/components/accounts/create-account-cta';
import { DateRangeSelector } from '@/components/app/date-range-selector';
import { PageHeader } from '@/components/app/page-header';
import { AccountBalanceChart } from '@/components/charts/account-balance-chart';
import { DrawdownChart } from '@/components/charts/drawdown-chart';
import { GaugeChart } from '@/components/charts/gauge-chart';
import { TradeDurationScatter } from '@/components/charts/trade-duration-scatter';
import { CalendarHeatmap } from '@/components/dashboard/calendar-heatmap';
import { DashboardEquityChart } from '@/components/dashboard/dashboard-equity-chart';
import { DashboardKpiGrid } from '@/components/dashboard/dashboard-kpi-grid';
import { DashboardMonthlyBars } from '@/components/dashboard/dashboard-monthly-bars';
import { DashboardPerformanceDonut } from '@/components/dashboard/dashboard-performance-donut';
import { DashboardAccountActions } from '@/components/dashboard/dashboard-account-actions';
import { DashboardRecentTrades } from '@/components/dashboard/dashboard-recent-trades';
import { ProgressTracker } from '@/components/dashboard/progress-tracker';
import { TraderScoreCard } from '@/components/dashboard/trader-score-card';
import { ChartEmpty } from '@/components/shared/chart-empty';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageBody } from '@/components/shared/page-body';
import { StatCard } from '@/components/shared/stat-card';
import { TradesTable } from '@/components/trades/trades-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import {
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPercent,
  formatProfitFactor,
  pnlColor,
} from '@/lib/format';
import { filtersKey, useGlobalFilters } from '@/lib/hooks/use-global-filters';
import { useActiveAccounts } from '@/lib/hooks/use-active-accounts';
import { useQuery } from '@/lib/hooks/use-query';
import { useReferenceData } from '@/lib/hooks/use-reference-data';
import { withTradeRelations } from '@/lib/trade-relations';
import { Activity, BookOpenCheck, Clock, Gauge, Plus, TrendingDown, TriangleAlert, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

/** Recharts-friendly fill (0-100) for the profit-factor gauge; 3.0 maps to full. */
function profitFactorFill(pf: number | null | undefined): number {
  if (pf === null || pf === undefined) return 0;
  return Math.min(100, (pf / 3) * 100);
}

const CHART_SKELETON = 'h-[240px] w-full';

export default function DashboardPage() {
  const router = useRouter();
  const filters = useGlobalFilters();
  const key = filtersKey(filters);
  const { playbooks, tags, mistakes } = useReferenceData();
  const { needsAccountFirst, isLoading: accountsLoading } = useActiveAccounts();

  const dashboard = useQuery(() => api.analytics.dashboard(filters), [key]);
  const recent = useQuery(
    () =>
      api.trades.list({
        accountId: filters.accountId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        limit: 6,
      }),
    [key],
  );
  const allTrades = useQuery(
    () =>
      api.trades.list({
        accountId: filters.accountId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        limit: 20,
      }),
    [key],
  );

  const d = dashboard.data;
  const o = d?.overview;
  const isLoading = dashboard.isLoading;

  const playbookNames = useMemo(
    () => Object.fromEntries(playbooks.map((p) => [p.id, p.name])),
    [playbooks],
  );

  const trades = useMemo(
    () => (allTrades.data?.items ?? []).map((t) => withTradeRelations(t, { tags, mistakes })),
    [allTrades.data, tags, mistakes],
  );

  return (
    <PageBody>
      <PageHeader
        description="Welcome back. Here's your trading overview."
        className="border-none pb-0"
        filters={<DateRangeSelector />}
        actions={
          <>
            <Button asChild>
              <Link href="/trades">
                <Plus className="h-4 w-4" />
                Log trade
              </Link>
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="outline" asChild>
                <Link href="/trades">View all trades</Link>
              </Button>
              <DashboardAccountActions />
            </div>
          </>
        }
      />

      {dashboard.error ? (
        <ErrorState onRetry={dashboard.refetch} />
      ) : (
        <>
          <DashboardKpiGrid
            overview={o}
            equityCurve={d?.equityCurve ?? []}
            calendar={d?.calendar ?? []}
            pnlOverTime={d?.pnlOverTime ?? []}
            isLoading={isLoading}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            <StatCard
              label="Sharpe ratio"
              icon={Gauge}
              isLoading={isLoading}
              value={
                o?.sharpeRatio === null || o?.sharpeRatio === undefined
                  ? '—'
                  : formatNumber(o.sharpeRatio, 2)
              }
              hint="Annualized · daily P&L"
            />
            <StatCard
              label="Max drawdown"
              icon={TrendingDown}
              isLoading={isLoading}
              value={formatCurrency(o ? -o.maxDrawdown : undefined)}
              valueClassName="text-destructive"
              hint={
                o && o.maxDrawdownPct !== null
                  ? `${formatPercent(o.maxDrawdownPct)} of peak`
                  : undefined
              }
            />
            <StatCard
              label="Avg hold time"
              icon={Clock}
              isLoading={isLoading}
              value={formatDuration(o?.avgHoldMinutes)}
              hint={
                o
                  ? `W ${formatDuration(o.avgWinHoldMinutes)} · L ${formatDuration(o.avgLossHoldMinutes)}`
                  : undefined
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <DashboardEquityChart data={d?.equityCurve ?? []} isLoading={isLoading} />
            </div>
            <DashboardPerformanceDonut overview={o} isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <DashboardMonthlyBars data={d?.pnlOverTime ?? []} isLoading={isLoading} />
            </div>
            <div className="lg:col-span-3">
              <DashboardRecentTrades
                trades={recent.data?.items ?? []}
                isLoading={recent.isLoading}
                onRowClick={(trade) => router.push(`/trades/${trade.id}`)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Trader score</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : o ? (
                  <TraderScoreCard score={o.traderScore} breakdown={o.traderScoreBreakdown} />
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Win rate</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="mx-auto h-[160px] w-[160px] rounded-full" />
                ) : (
                  <GaugeChart
                    value={(o?.winRate ?? 0) * 100}
                    displayValue={formatPercent((o?.winRate ?? 0) * 100)}
                    caption={
                      o ? `${o.winningTrades}W · ${o.losingTrades}L` : undefined
                    }
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profit factor</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="mx-auto h-[160px] w-[160px] rounded-full" />
                ) : (
                  <GaugeChart
                    value={profitFactorFill(o?.profitFactor)}
                    displayValue={formatProfitFactor(o?.profitFactor)}
                    caption={
                      o ? `Expectancy ${formatCurrency(o.expectancy)}` : undefined
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Best setup</CardTitle>
                <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-40" />
                ) : o?.bestSetup ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium">{o.bestSetup.label}</span>
                    <span className={pnlColor(o.bestSetup.netPnl)}>
                      {formatCurrency(o.bestSetup.netPnl, { signed: true })}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not enough data yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Worst mistake</CardTitle>
                <TriangleAlert className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-40" />
                ) : o?.worstMistake ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium">{o.worstMistake.label}</span>
                    <span className="text-destructive">
                      {formatCurrency(o.worstMistake.pnlImpact)} · {o.worstMistake.count}×
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recurring mistakes logged.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <PeriodAiReviewCard filters={filters} />

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Account balance</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className={CHART_SKELETON} />
                ) : d?.accountBalance && d.accountBalance.length > 0 ? (
                  <AccountBalanceChart data={d.accountBalance} />
                ) : (
                  <ChartEmpty message="No closed trades in this period." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progress tracker</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[180px] w-full" />
                ) : (
                  <ProgressTracker
                    data={d?.calendar ?? []}
                    greenDayRate={o?.greenDayRate ?? 0}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Drawdown</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className={CHART_SKELETON} />
                ) : d?.drawdown && d.drawdown.length > 0 ? (
                  <DrawdownChart data={d.drawdown} />
                ) : (
                  <ChartEmpty message="No closed trades in this period." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trade duration vs P&L</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className={CHART_SKELETON} />
                ) : d?.tradeDuration && d.tradeDuration.length > 0 ? (
                  <TradeDurationScatter data={d.tradeDuration} />
                ) : (
                  <ChartEmpty message="No closed trades with hold times." />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">P&L calendar</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[360px] w-full" />
              ) : (
                <CalendarHeatmap data={d?.calendar ?? []} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Trades</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/trades">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="px-0">
              {allTrades.isLoading ? (
                <div className="space-y-2 px-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton rows.
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : trades.length > 0 ? (
                <TradesTable
                  trades={trades}
                  playbookNames={playbookNames}
                  onRowClick={(t) => router.push(`/trades/${t.id}`)}
                />
              ) : (
                <div className="px-6">
                  <EmptyState
                    icon={needsAccountFirst ? Wallet : Activity}
                    title={needsAccountFirst ? 'Create a journal first' : 'No trades logged'}
                    message={
                      needsAccountFirst
                        ? 'Add a journal before you can log or import trades.'
                        : 'Once you log trades, your activity shows up here.'
                    }
                    action={
                      accountsLoading ? undefined : needsAccountFirst ? (
                        <CreateAccountCta />
                      ) : (
                        <Button asChild>
                          <Link href="/trades">
                            <Plus className="h-4 w-4" />
                            Log trade
                          </Link>
                        </Button>
                      )
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageBody>
  );
}
