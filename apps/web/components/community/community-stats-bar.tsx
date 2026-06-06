'use client';

import { ListMetricsBar } from '@/components/shared/list-metrics-bar';
import { formatCurrency, formatNumber, pnlColor } from '@/lib/format';
import type { CommunityStats } from '@/lib/types';

interface CommunityStatsBarProps {
  stats: CommunityStats;
}

export function CommunityStatsBar({ stats }: CommunityStatsBarProps) {
  return (
    <ListMetricsBar
      ariaLabel="Community performance summary"
      metrics={[
        { label: 'Members', value: formatNumber(stats.memberCount) },
        { label: 'Active traders', value: formatNumber(stats.activeTraders) },
        {
          label: `Net P&L (${stats.periodDays}d)`,
          value: formatCurrency(stats.aggregateNetPnl),
          valueClassName: pnlColor(stats.aggregateNetPnl),
        },
      ]}
    />
  );
}
