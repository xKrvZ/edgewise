'use client';

import { ListMetricsBar } from '@/components/shared/list-metrics-bar';
import { formatCurrency, formatDate, formatNumber, formatPercent, pnlColor } from '@/lib/format';
import type { TradeListSummary } from '@/lib/trade-list-stats';

interface TradeMetricsBarProps {
  summary: TradeListSummary;
}

export function TradeMetricsBar({ summary }: TradeMetricsBarProps) {
  const { total, winRate, netPnl, lastTradeDate, isFullPage } = summary;

  return (
    <ListMetricsBar
      ariaLabel="Trade list summary"
      metrics={[
        { label: 'Trades', value: formatNumber(total) },
        {
          label: 'Win rate',
          value: winRate !== null ? formatPercent(winRate) : '—',
        },
        {
          label: 'Net P&L',
          value:
            netPnl !== null
              ? formatCurrency(netPnl, { signed: true })
              : isFullPage
                ? '$0.00'
                : '—',
          valueClassName: netPnl !== null ? pnlColor(netPnl) : undefined,
        },
        {
          label: 'Last trade',
          value: lastTradeDate ? formatDate(lastTradeDate) : '—',
        },
      ]}
    />
  );
}
