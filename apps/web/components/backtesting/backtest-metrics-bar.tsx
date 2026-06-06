'use client';

import { ListMetricsBar } from '@/components/shared/list-metrics-bar';
import { formatCurrency, formatNumber, pnlColor } from '@/lib/format';
import type { BacktestListSummary } from '@/lib/backtest-stats';

interface BacktestMetricsBarProps {
  summary: BacktestListSummary;
}

export function BacktestMetricsBar({ summary }: BacktestMetricsBarProps) {
  const { total, totalTrades, aggregatePnl, uniqueSymbols } = summary;

  const metrics = [
    { label: 'Backtests', value: formatNumber(total) },
    { label: 'Trades', value: formatNumber(totalTrades) },
    {
      label: 'Combined P&L',
      value:
        aggregatePnl !== null
          ? formatCurrency(aggregatePnl, { signed: true })
          : totalTrades > 0
            ? '—'
            : '$0.00',
      valueClassName: aggregatePnl !== null ? pnlColor(aggregatePnl) : undefined,
    },
  ];

  if (uniqueSymbols > 0) {
    metrics.push({ label: 'Symbols', value: formatNumber(uniqueSymbols) });
  }

  return <ListMetricsBar ariaLabel="Backtest portfolio summary" metrics={metrics} />;
}
