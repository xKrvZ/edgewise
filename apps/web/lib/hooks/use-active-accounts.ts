'use client';

import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import { useMemo } from 'react';

/**
 * Loads non-archived accounts for gating trade empty states and forms.
 */
export function useActiveAccounts() {
  const accountsQuery = useQuery(() => api.accounts.list(), []);

  const activeAccounts = useMemo(
    () => (accountsQuery.data ?? []).filter((account) => !account.isArchived),
    [accountsQuery.data],
  );

  return {
    activeAccounts,
    isLoading: accountsQuery.isLoading,
    refetch: accountsQuery.refetch,
    needsAccountFirst: !accountsQuery.isLoading && activeAccounts.length === 0,
  };
}
