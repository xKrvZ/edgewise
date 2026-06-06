import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AccountState {
  /** Currently selected account id, or null for "All accounts". */
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set) => ({
      selectedAccountId: null,
      setSelectedAccountId: (id) => set({ selectedAccountId: id }),
    }),
    { name: 'edgewise.account' },
  ),
);
