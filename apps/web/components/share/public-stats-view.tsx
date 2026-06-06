'use client';

import { EquityCurveChart } from '@/components/charts/equity-curve-chart';
import { InlineStat } from '@/components/shared/inline-stat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent, pnlColor } from '@/lib/format';
import type { PublicStats } from '@/lib/types';

interface PublicStatsViewProps {
  stats: PublicStats;
}

export function PublicStatsView({ stats }: PublicStatsViewProps) {
  const { overview } = stats;

  return (
    <div className="space-y-8">
      <header className="space-y-2 border-b border-border/60 pb-6">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-primary">
          Shared stats
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {stats.displayName ?? 'Trader stats'}
        </h1>
        {stats.bio && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{stats.bio}</p>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        <InlineStat
          label="Net P&L"
          value={formatCurrency(overview.netPnl, { signed: true })}
          valueClassName={pnlColor(overview.netPnl)}
        />
        <InlineStat label="Win rate" value={formatPercent(overview.winRate)} />
        <InlineStat label="Total trades" value={String(overview.totalTrades)} />
        <InlineStat
          label="Profit factor"
          value={overview.profitFactor === null ? '—' : overview.profitFactor.toFixed(2)}
        />
        <InlineStat
          label="Expectancy"
          value={formatCurrency(overview.expectancy, { signed: true })}
          valueClassName={pnlColor(overview.expectancy)}
        />
        <InlineStat
          label="Avg R"
          value={overview.avgR === null ? '—' : overview.avgR.toFixed(2)}
          valueClassName={pnlColor(overview.avgR)}
        />
        <InlineStat label="Zella score" value={String(Math.round(overview.zellaScore))} />
        <InlineStat
          label="Max drawdown"
          value={formatCurrency(-overview.maxDrawdown)}
          valueClassName="text-destructive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equity curve</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.equityCurve.length === 0 ? (
            <p className="text-sm text-muted-foreground">No closed trades to chart yet.</p>
          ) : (
            <EquityCurveChart data={stats.equityCurve} height={300} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
