'use client';

import { AccountFormDialog } from '@/components/accounts/account-form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ApiError, api } from '@/lib/api-client';
import { useActiveAccounts } from '@/lib/hooks/use-active-accounts';
import { useAccountStore } from '@/stores/account-store';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export function DashboardAccountActions() {
  const { selectedAccountId, setSelectedAccountId, bumpAccountsRevision } = useAccountStore();
  const { activeAccounts, refetch } = useActiveAccounts();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const selectedAccount = useMemo(
    () => activeAccounts.find((account) => account.id === selectedAccountId),
    [activeAccounts, selectedAccountId],
  );

  const canDeleteAccount = activeAccounts.length > 1;

  async function confirmDelete() {
    if (!selectedAccount) return;
    try {
      await api.accounts.remove(selectedAccount.id);
      toast.success('Journal deleted');
      if (selectedAccountId === selectedAccount.id) {
        setSelectedAccountId(null);
      }
      bumpAccountsRevision();
      await refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete journal');
    }
  }

  function handleDeleteClick() {
    if (!canDeleteAccount) {
      toast.error('Cannot delete your only journal. Create another journal first.');
      return;
    }
    setDeleteOpen(true);
  }

  function handleSaved() {
    bumpAccountsRevision();
    void refetch();
  }

  if (!selectedAccount) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Journal actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setFormOpen(true)}>
            <Pencil />
            Edit journal
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleDeleteClick}>
            <Trash2 />
            Delete journal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={selectedAccount}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this journal?"
        description={`${selectedAccount.name} and all of its trades, screenshots, and related data will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete journal"
        onConfirm={confirmDelete}
      />
    </>
  );
}
