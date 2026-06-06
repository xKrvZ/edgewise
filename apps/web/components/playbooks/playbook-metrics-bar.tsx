'use client';

import { ListMetricsBar } from '@/components/shared/list-metrics-bar';
import { formatDate, formatNumber } from '@/lib/format';
import type { PlaybookListSummary } from '@/lib/playbook-stats';

interface PlaybookMetricsBarProps {
  summary: PlaybookListSummary;
}

export function PlaybookMetricsBar({ summary }: PlaybookMetricsBarProps) {
  const { total, withRules, totalRules, mostRecent } = summary;

  return (
    <ListMetricsBar
      ariaLabel="Playbook portfolio summary"
      metrics={[
        { label: 'Playbooks', value: formatNumber(total) },
        { label: 'With rules', value: formatNumber(withRules) },
        { label: 'Total rules', value: formatNumber(totalRules) },
        {
          label: 'Last updated',
          value: mostRecent ? formatDate(mostRecent.updatedAt) : '—',
        },
      ]}
    />
  );
}
