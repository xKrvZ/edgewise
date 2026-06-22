import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AccountState {
  /** Currently selected journal id, or null for "All journals". */
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  /** Bumped when accounts are created, updated, or deleted elsewhere in the app. */
  accountsRevision: number;
  bumpAccountsRevision: () => void;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set) => ({
      selectedAccountId: null,
      setSelectedAccountId: (id) => set({ selectedAccountId: id }),
      accountsRevision: 0,
      bumpAccountsRevision: () =>
        set((state) => ({ accountsRevision: state.accountsRevision + 1 })),
    }),
    {
      name: 'edgewise.account',
      partialize: (state) => ({ selectedAccountId: state.selectedAccountId }),
    },
  ),
);
