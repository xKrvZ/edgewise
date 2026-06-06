'use client';

import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDuration, formatPercent, pnlColor } from '@/lib/format';
import type { AnalyticsOverview } from '@/lib/types';
import { cn } from '@/lib/utils';

interface WinsVsLossesSectionProps {
  overview: AnalyticsOverview | undefined;
  isLoading: boolean;
}

export function WinsVsLossesSection({ overview, isLoading }: WinsVsLossesSectionProps) {
  const o = overview;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Wins vs losses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Winners"
            isLoading={isLoading}
            value={o ? String(o.winningTrades) : '—'}
            hint={o ? formatPercent(o.winRate) : undefined}
            valueClassName="text-success"
          />
          <StatCard
            label="Losers"
            isLoading={isLoading}
            value={o ? String(o.losingTrades) : '—'}
            hint={
              o && o.totalTrades > 0
                ? formatPercent(o.losingTrades / o.totalTrades)
                : undefined
            }
            valueClassName="text-destructive"
          />
          <StatCard
            label="Breakeven"
            isLoading={isLoading}
            value={o ? String(o.breakevenTrades) : '—'}
            hint="Uses account breakeven range when filtered"
          />
          <StatCard
            label="Total fees"
            isLoading={isLoading}
            value={formatCurrency(o?.totalFees)}
            hint="Commissions deducted from net P&L"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <CompareBlock
            title="Winners"
            count={o?.winningTrades}
            avgPnl={o?.avgWinner}
            avgHold={o?.avgWinHoldMinutes}
            largest={o?.largestWin}
            gross={o?.grossProfit}
            tone="win"
            isLoading={isLoading}
          />
          <CompareBlock
            title="Losers"
            count={o?.losingTrades}
            avgPnl={o?.avgLoser}
            avgHold={o?.avgLossHoldMinutes}
            largest={o?.largestLoss}
            gross={o?.grossLoss}
            tone="loss"
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function CompareBlock({
  title,
  count,
  avgPnl,
  avgHold,
  largest,
  gross,
  tone,
  isLoading,
}: {
  title: string;
  count: number | undefined;
  avgPnl: number | undefined;
  avgHold: number | undefined;
  largest: number | undefined;
  gross: number | undefined;
  tone: 'win' | 'loss';
  isLoading: boolean;
}) {
  const color = tone === 'win' ? 'text-success' : 'text-destructive';

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium">
        {title}
        {!isLoading && count !== undefined ? (
          <span className="ml-2 text-muted-foreground">({count})</span>
        ) : null}
      </h3>
      <dl className="mt-3 space-y-2 text-sm">
        <Row label="Gross P&L" value={formatCurrency(gross, { signed: true })} className={color} />
        <Row label="Average" value={formatCurrency(avgPnl, { signed: true })} className={color} />
        <Row label="Largest" value={formatCurrency(largest, { signed: true })} className={color} />
        <Row label="Avg hold" value={formatDuration(avgHold)} />
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('font-medium tabular-nums', className)}>{value}</dd>
    </div>
  );
}
