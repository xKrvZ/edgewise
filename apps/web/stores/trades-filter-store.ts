import type { MarketType, TradeDirection } from '@/lib/types';
import { create } from 'zustand';

export interface TradesFilterState {
  symbol: string;
  direction: TradeDirection | null;
  marketType: MarketType | null;
  tagId: string | null;
  playbookId: string | null;
  setupId: string | null;
  limit: number;

  setSymbol: (symbol: string) => void;
  setDirection: (direction: TradeDirection | null) => void;
  setMarketType: (marketType: MarketType | null) => void;
  setTagId: (tagId: string | null) => void;
  setPlaybookId: (playbookId: string | null) => void;
  setSetupId: (setupId: string | null) => void;
  setLimit: (limit: number) => void;
  reset: () => void;
}

const initialFilters = {
  symbol: '',
  direction: null as TradeDirection | null,
  marketType: null as MarketType | null,
  tagId: null as string | null,
  playbookId: null as string | null,
  setupId: null as string | null,
  limit: 25,
};

export const useTradesFilterStore = create<TradesFilterState>()((set) => ({
  ...initialFilters,
  setSymbol: (symbol) => set({ symbol }),
  setDirection: (direction) => set({ direction }),
  setMarketType: (marketType) => set({ marketType }),
  setTagId: (tagId) => set({ tagId }),
  setPlaybookId: (playbookId) => set({ playbookId }),
  setSetupId: (setupId) => set({ setupId }),
  setLimit: (limit) => set({ limit }),
  reset: () => set({ ...initialFilters }),
}));
