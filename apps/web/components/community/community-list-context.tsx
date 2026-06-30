'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useCommunityListQueries } from '@/components/community/use-community-list-queries';

type CommunityListContextValue = ReturnType<typeof useCommunityListQueries>;

const CommunityListContext = createContext<CommunityListContextValue | null>(null);

export function CommunityListProvider({ children }: { children: ReactNode }) {
  const value = useCommunityListQueries();
  return <CommunityListContext.Provider value={value}>{children}</CommunityListContext.Provider>;
}

export function useCommunityListContext() {
  const context = useContext(CommunityListContext);
  if (!context) {
    throw new Error('useCommunityListContext must be used within CommunityListProvider');
  }
  return context;
}
