'use client';

import type { AnalyticsQuery } from '@/lib/types';
import { useAccountStore } from '@/stores/account-store';
import { useDateRangeStore } from '@/stores/date-range-store';
import { useMemo } from 'react';

/**
 * Builds the shared `{ accountId, dateFrom, dateTo }` query consumed by the
 * analytics, dashboard, and AI-review endpoints from the global selectors.
 * Returns a stable object suitable as a `useQuery` dependency.
 */
export function useGlobalFilters(): AnalyticsQuery {
  const selectedAccountId = useAccountStore((s) => s.selectedAccountId);
  const from = useDateRangeStore((s) => s.from);
  const to = useDateRangeStore((s) => s.to);

  return useMemo<AnalyticsQuery>(
    () => ({
      accountId: selectedAccountId ?? undefined,
      dateFrom: from ?? undefined,
      dateTo: to ?? undefined,
    }),
    [selectedAccountId, from, to],
  );
}

/** Serialized key for dependency arrays. */
export function filtersKey(filters: AnalyticsQuery): string {
  return [
    filters.accountId ?? '',
    filters.dateFrom ?? '',
    filters.dateTo ?? '',
    filters.marketType ?? '',
    filters.direction ?? '',
  ].join('|');
}
