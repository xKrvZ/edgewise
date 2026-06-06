'use client';

import { GroupStatSection } from '@/components/analytics/group-stat-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import { formatCurrency, pnlColor } from '@/lib/format';
import { useGlobalFilters } from '@/lib/hooks/use-global-filters';
import { useQuery } from '@/lib/hooks/use-query';
import Link from 'next/link';

export function PlaybookPerformanceSection() {
  const filters = useGlobalFilters();
  const key = JSON.stringify(filters);
  const bySetup = useQuery(() => api.analytics.bySetup(filters), [key]);
  const top = bySetup.data?.slice(0, 5) ?? [];

  return (
    <div className="space-y-4">
      <GroupStatSection
        title="Playbook performance"
        description="Ranked by net P&L for the current filter period. Link trades to playbooks to populate this."
        data={bySetup.data}
        isLoading={bySetup.isLoading}
      />
      {top.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top performers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {top.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                {row.key !== 'none' ? (
                  <Link
                    href={`/playbooks/${row.key}`}
                    className="font-medium hover:underline"
                  >
                    {row.label}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">{row.label}</span>
                )}
                <span className={pnlColor(row.netPnl)}>
                  {formatCurrency(row.netPnl, { signed: true })} · {row.trades} trades
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
