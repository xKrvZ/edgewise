import type { MarketType, TradeDirection } from '@/lib/types';
import { create } from 'zustand';

export interface TradesFilterState {
  symbol: string;
  direction: TradeDirection | null;
  marketType: MarketType | null;
  tagId: string | null;
  playbookId: string | null;
  setupId: string | null;
  page: number;
  limit: number;

  setSymbol: (symbol: string) => void;
  setDirection: (direction: TradeDirection | null) => void;
  setMarketType: (marketType: MarketType | null) => void;
  setTagId: (tagId: string | null) => void;
  setPlaybookId: (playbookId: string | null) => void;
  setSetupId: (setupId: string | null) => void;
  setPage: (page: number) => void;
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
  page: 1,
  limit: 25,
};

export const useTradesFilterStore = create<TradesFilterState>()((set) => ({
  ...initialFilters,
  setSymbol: (symbol) => set({ symbol, page: 1 }),
  setDirection: (direction) => set({ direction, page: 1 }),
  setMarketType: (marketType) => set({ marketType, page: 1 }),
  setTagId: (tagId) => set({ tagId, page: 1 }),
  setPlaybookId: (playbookId) => set({ playbookId, page: 1 }),
  setSetupId: (setupId) => set({ setupId, page: 1 }),
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),
  reset: () => set({ ...initialFilters }),
}));
