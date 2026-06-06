'use client';

import { ComparePeriodsSection } from '@/components/analytics/compare-periods-section';
import { GroupStatSection } from '@/components/analytics/group-stat-section';
import { WinsVsLossesSection } from '@/components/analytics/wins-vs-losses-section';
import { DateRangeSelector } from '@/components/app/date-range-selector';
import { PageFilterBar } from '@/components/app/page-filter-bar';
import { PageHeader } from '@/components/app/page-header';
import { EquityCurveChart } from '@/components/charts/equity-curve-chart';
import { PnlBarChart } from '@/components/charts/pnl-bar-chart';
import { RDistributionChart } from '@/components/charts/r-distribution-chart';
import { ChartEmpty } from '@/components/shared/chart-empty';
import { ErrorState } from '@/components/shared/error-state';
import { PageBody } from '@/components/shared/page-body';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api-client';
import {
  formatCurrency,
  formatDuration,
  formatPercent,
  formatProfitFactor,
  formatR,
  pnlColor,
} from '@/lib/format';
import { filtersKey, useGlobalFilters } from '@/lib/hooks/use-global-filters';
import { useQuery } from '@/lib/hooks/use-query';
import {
  type AnalyticsQuery,
  MARKET_TYPES,
  type MarketType,
  TRADE_DIRECTIONS,
  type TradeDirection,
} from '@/lib/types';
import { useMemo, useState } from 'react';

const ANY = '__any__';

export default function AnalyticsPage() {
  const base = useGlobalFilters();
  const [marketType, setMarketType] = useState<MarketType | null>(null);
  const [direction, setDirection] = useState<TradeDirection | null>(null);

  const filters: AnalyticsQuery = useMemo(
    () => ({
      ...base,
      marketType: marketType ?? undefined,
      direction: direction ?? undefined,
    }),
    [base, marketType, direction],
  );
  const key = filtersKey(filters);

  const overview = useQuery(() => api.analytics.overview(filters), [key]);
  const equity = useQuery(() => api.analytics.equityCurve(filters), [key]);
  const pnl = useQuery(() => api.analytics.pnlOverTime(filters), [key]);
  const rDist = useQuery(() => api.analytics.rDistribution(filters), [key]);
  const bySetup = useQuery(() => api.analytics.bySetup(filters), [key]);
  const bySymbol = useQuery(() => api.analytics.bySymbol(filters), [key]);
  const byDow = useQuery(() => api.analytics.byDayOfWeek(filters), [key]);
  const byTod = useQuery(() => api.analytics.byTimeOfDay(filters), [key]);
  const byMistake = useQuery(() => api.analytics.byMistake(filters), [key]);
  const bySession = useQuery(() => api.analytics.bySession(filters), [key]);
  const byAccount = useQuery(() => api.analytics.byAccount(filters), [key]);
  const byDirection = useQuery(() => api.analytics.byDirection(filters), [key]);

  const o = overview.data;

  return (
    <PageBody>
      <PageHeader
        title="Analytics"
        description="Break down your edge by setup, symbol, session and time."
        eyebrow="Insights"
      />

      <PageFilterBar>
        <DateRangeSelector />
        <Select
          value={marketType ?? ANY}
          onValueChange={(v) => setMarketType(v === ANY ? null : (v as MarketType))}
        >
          <SelectTrigger size="sm" className="h-9 w-32">
            <SelectValue placeholder="Market" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any market</SelectItem>
            {MARKET_TYPES.map((m) => (
              <SelectItem key={m} value={m} className="capitalize">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={direction ?? ANY}
          onValueChange={(v) => setDirection(v === ANY ? null : (v as TradeDirection))}
        >
          <SelectTrigger size="sm" className="h-9 w-32">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any side</SelectItem>
            {TRADE_DIRECTIONS.map((d) => (
              <SelectItem key={d} value={d} className="capitalize">
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageFilterBar>

      {overview.error ? (
        <ErrorState onRetry={overview.refetch} />
      ) : (
        <Tabs defaultValue="overview" className="gap-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="wins-losses">Wins vs losses</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
            <TabsTrigger value="setup">Setup &amp; symbol</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Net P&L"
                isLoading={overview.isLoading}
                value={formatCurrency(o?.netPnl, { signed: true })}
                valueClassName={pnlColor(o?.netPnl)}
              />
              <StatCard
                label="Win rate"
                isLoading={overview.isLoading}
                value={formatPercent(o?.winRate)}
              />
              <StatCard
                label="Profit factor"
                isLoading={overview.isLoading}
                value={formatProfitFactor(o?.profitFactor)}
              />
              <StatCard
                label="Expectancy"
                isLoading={overview.isLoading}
                value={formatCurrency(o?.expectancy, { signed: true })}
                valueClassName={pnlColor(o?.expectancy)}
              />
              <StatCard
                label="Avg winner"
                isLoading={overview.isLoading}
                value={formatCurrency(o?.avgWinner)}
                valueClassName="text-success"
              />
              <StatCard
                label="Avg loser"
                isLoading={overview.isLoading}
                value={formatCurrency(o?.avgLoser)}
                valueClassName="text-destructive"
              />
              <StatCard
                label="Avg R"
                isLoading={overview.isLoading}
                value={formatR(o?.avgR)}
                valueClassName={pnlColor(o?.avgR)}
              />
              <StatCard
                label="Avg hold"
                isLoading={overview.isLoading}
                value={formatDuration(o?.avgHoldMinutes)}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Equity curve" loading={equity.isLoading}>
                {equity.data && equity.data.length > 0 ? (
                  <EquityCurveChart data={equity.data} />
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>
              <ChartCard title="P&L over time" loading={pnl.isLoading}>
                {pnl.data && pnl.data.length > 0 ? <PnlBarChart data={pnl.data} /> : <EmptyChart />}
              </ChartCard>
            </div>

            <ChartCard title="R-multiple distribution" loading={rDist.isLoading}>
              {rDist.data && rDist.data.length > 0 ? (
                <RDistributionChart data={rDist.data} />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <div className="grid gap-4 lg:grid-cols-2">
              <GroupStatSection
                title="Long vs short"
                data={byDirection.data}
                isLoading={byDirection.isLoading}
              />
              <GroupStatSection
                title="Largest win / loss"
                data={largestStats(o)}
                isLoading={overview.isLoading}
                tableOnly
              />
            </div>
          </TabsContent>

          <TabsContent value="wins-losses" className="space-y-4">
            <WinsVsLossesSection overview={o} isLoading={overview.isLoading} />
          </TabsContent>

          <TabsContent value="compare" className="space-y-4">
            <ComparePeriodsSection />
          </TabsContent>

          <TabsContent value="setup" className="space-y-4">
            <GroupStatSection
              title="Performance by setup"
              description="Which playbooks actually make you money."
              data={bySetup.data}
              isLoading={bySetup.isLoading}
            />
            <GroupStatSection
              title="Performance by symbol"
              data={bySymbol.data}
              isLoading={bySymbol.isLoading}
            />
          </TabsContent>

          <TabsContent value="timing" className="space-y-4">
            <GroupStatSection title="Day of week" data={byDow.data} isLoading={byDow.isLoading} />
            <GroupStatSection title="Time of day" data={byTod.data} isLoading={byTod.isLoading} />
            <GroupStatSection
              title="Session"
              data={bySession.data}
              isLoading={bySession.isLoading}
            />
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4">
            <GroupStatSection
              title="Cost of mistakes"
              description="P&L impact grouped by the mistakes you tagged."
              data={byMistake.data}
              isLoading={byMistake.isLoading}
            />
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <GroupStatSection
              title="Performance by account"
              data={byAccount.data}
              isLoading={byAccount.isLoading}
            />
          </TabsContent>
        </Tabs>
      )}
    </PageBody>
  );
}

function largestStats(
  o:
    | {
        largestWin: number;
        largestLoss: number;
        winningTrades: number;
        losingTrades: number;
      }
    | undefined,
) {
  if (!o) return [];
  return [
    {
      key: 'win',
      label: 'Largest win',
      trades: o.winningTrades,
      netPnl: o.largestWin,
      winRate: 100,
      profitFactor: null,
      avgR: null,
      expectancy: o.largestWin,
    },
    {
      key: 'loss',
      label: 'Largest loss',
      trades: o.losingTrades,
      netPnl: o.largestLoss,
      winRate: 0,
      profitFactor: null,
      avgR: null,
      expectancy: o.largestLoss,
    },
  ];
}

function ChartCard({
  title,
  loading,
  children,
}: {
  title: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{loading ? <Skeleton className="h-[280px] w-full" /> : children}</CardContent>
    </Card>
  );
}

function EmptyChart() {
  return <ChartEmpty height={280} />;
}
