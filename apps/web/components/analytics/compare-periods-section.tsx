'use client';

import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api-client';
import { formatCurrency, formatPercent, formatProfitFactor, pnlColor } from '@/lib/format';
import { useGlobalFilters } from '@/lib/hooks/use-global-filters';
import { useQuery } from '@/lib/hooks/use-query';
import type { AnalyticsQuery } from '@/lib/types';
import { useMemo, useState } from 'react';
import { subMonths, format } from 'date-fns';

export function ComparePeriodsSection() {
  const base = useGlobalFilters();
  const [enabled, setEnabled] = useState(false);
  const [compareFrom, setCompareFrom] = useState(() =>
    format(subMonths(new Date(), 2), 'yyyy-MM-dd'),
  );
  const [compareTo, setCompareTo] = useState(() =>
    format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
  );

  const compareFilters: AnalyticsQuery = useMemo(
    () => ({
      ...base,
      dateFrom: compareFrom ? new Date(compareFrom).toISOString() : undefined,
      dateTo: compareTo ? new Date(`${compareTo}T23:59:59`).toISOString() : undefined,
    }),
    [base, compareFrom, compareTo],
  );

  const currentKey = JSON.stringify(base);
  const compareKey = JSON.stringify(compareFilters);

  const current = useQuery(() => api.analytics.overview(base), [currentKey]);
  const previous = useQuery(() => api.analytics.overview(compareFilters), [compareKey], {
    enabled,
  });

  const rows = [
    { label: 'Net P&L', fmt: (v: number) => formatCurrency(v, { signed: true }), key: 'netPnl' as const },
    { label: 'Win rate', fmt: (v: number) => formatPercent(v), key: 'winRate' as const },
    {
      label: 'Profit factor',
      fmt: (v: number | null) => formatProfitFactor(v),
      key: 'profitFactor' as const,
    },
    { label: 'Trades', fmt: (v: number) => String(v), key: 'totalTrades' as const },
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base">Compare periods</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Stack current filters against a prior date range.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={setEnabled} id="compare-toggle" />
          <Label htmlFor="compare-toggle" className="text-sm">
            Enable
          </Label>
        </div>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Compare from</Label>
              <Input
                type="date"
                value={compareFrom}
                onChange={(e) => setCompareFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Compare to</Label>
              <Input
                type="date"
                value={compareTo}
                onChange={(e) => setCompareTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCompareFrom(format(subMonths(new Date(), 2), 'yyyy-MM-dd'));
                setCompareTo(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
              }}
            >
              Last month
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-3 py-2 font-medium">Metric</th>
                  <th className="px-3 py-2 font-medium">Current period</th>
                  <th className="px-3 py-2 font-medium">Compare period</th>
                  <th className="px-3 py-2 font-medium">Delta</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const cur = current.data?.[row.key];
                  const prev = previous.data?.[row.key];
                  const delta =
                    typeof cur === 'number' && typeof prev === 'number' ? cur - prev : null;
                  return (
                    <tr key={row.key} className="border-b last:border-0">
                      <td className="px-3 py-2 text-muted-foreground">{row.label}</td>
                      <td className="px-3 py-2 font-medium tabular-nums">
                        {current.isLoading ? (
                          <Skeleton className="h-4 w-16" />
                        ) : (
                          <span className={row.key === 'netPnl' ? pnlColor(cur as number) : ''}>
                            {row.fmt(cur as never)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium tabular-nums">
                        {previous.isLoading ? (
                          <Skeleton className="h-4 w-16" />
                        ) : (
                          <span className={row.key === 'netPnl' ? pnlColor(prev as number) : ''}>
                            {row.fmt(prev as never)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {delta === null ? (
                          '—'
                        ) : (
                          <span className={row.key === 'netPnl' ? pnlColor(delta) : ''}>
                            {row.key === 'winRate'
                              ? formatPercent(delta)
                              : row.key === 'profitFactor'
                                ? formatProfitFactor(delta)
                                : row.key === 'totalTrades'
                                  ? (delta >= 0 ? '+' : '') + delta
                                  : formatCurrency(delta, { signed: true })}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Current net P&L"
              isLoading={current.isLoading}
              value={formatCurrency(current.data?.netPnl, { signed: true })}
              valueClassName={pnlColor(current.data?.netPnl)}
            />
            <StatCard
              label="Compare net P&L"
              isLoading={previous.isLoading}
              value={formatCurrency(previous.data?.netPnl, { signed: true })}
              valueClassName={pnlColor(previous.data?.netPnl)}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
