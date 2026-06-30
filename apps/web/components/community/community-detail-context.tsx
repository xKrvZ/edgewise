'use client';

import { createContext, useContext } from 'react';
import type { CommunityDetail } from '@/lib/types';

interface CommunityDetailContextValue {
  community: CommunityDetail;
  refreshCommunity: () => void;
}

const CommunityDetailContext = createContext<CommunityDetailContextValue | null>(null);

export function CommunityDetailProvider({
  community,
  refreshCommunity,
  children,
}: CommunityDetailContextValue & { children: React.ReactNode }) {
  return (
    <CommunityDetailContext.Provider value={{ community, refreshCommunity }}>
      {children}
    </CommunityDetailContext.Provider>
  );
}

export function useCommunityDetail(): CommunityDetailContextValue {
  const value = useContext(CommunityDetailContext);
  if (!value) {
    throw new Error('useCommunityDetail must be used within CommunityDetailProvider');
  }
  return value;
}
