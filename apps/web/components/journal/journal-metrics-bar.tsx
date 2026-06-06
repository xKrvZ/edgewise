'use client';

import { ListMetricsBar } from '@/components/shared/list-metrics-bar';
import { formatDate, formatNumber } from '@/lib/format';
import type { JournalListSummary } from '@/lib/journal-stats';

interface JournalMetricsBarProps {
  summary: JournalListSummary;
}

export function JournalMetricsBar({ summary }: JournalMetricsBarProps) {
  const { total, mostRecent, streak } = summary;

  return (
    <ListMetricsBar
      ariaLabel="Journal summary"
      metrics={[
        { label: 'Entries', value: formatNumber(total) },
        {
          label: 'Last entry',
          value: mostRecent ? formatDate(mostRecent.date) : '—',
        },
        {
          label: 'Streak',
          value: streak > 0 ? `${formatNumber(streak)}d` : '—',
        },
      ]}
    />
  );
}
