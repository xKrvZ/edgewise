'use client';

import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import type { Account, Mistake, Playbook, Tag, TradingSession } from '@/lib/types';

interface ReferenceData {
  accounts: Account[];
  playbooks: Playbook[];
  sessions: TradingSession[];
  tags: Tag[];
  mistakes: Mistake[];
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Loads the small reference collections used to populate trade/journal forms
 * and filter selectors. Each falls back to an empty array if the backend is
 * unavailable so forms still render.
 */
export function useReferenceData(): ReferenceData {
  const accounts = useQuery(() => api.accounts.list(), []);
  const playbooks = useQuery(() => api.playbooks.list(), []);
  const sessions = useQuery(() => api.tradingSessions.list(), []);
  const tags = useQuery(() => api.tags.list(), []);
  const mistakes = useQuery(() => api.mistakes.list(), []);

  return {
    accounts: accounts.data ?? [],
    playbooks: playbooks.data ?? [],
    sessions: sessions.data ?? [],
    tags: tags.data ?? [],
    mistakes: mistakes.data ?? [],
    isLoading:
      accounts.isLoading ||
      playbooks.isLoading ||
      sessions.isLoading ||
      tags.isLoading ||
      mistakes.isLoading,
    refetch: () => {
      accounts.refetch();
      playbooks.refetch();
      sessions.refetch();
      tags.refetch();
      mistakes.refetch();
    },
  };
}
