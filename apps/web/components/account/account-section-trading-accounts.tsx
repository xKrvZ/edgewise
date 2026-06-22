'use client';

import { AccountCard } from '@/components/accounts/account-card';
import { AccountFormDialog } from '@/components/accounts/account-form-dialog';
import { AccountSettingsSection } from '@/components/account/account-settings-section';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, api } from '@/lib/api-client';
import { useSubscription } from '@/lib/hooks/use-subscription';
import type { Account } from '@/lib/types';
import { useAccountStore } from '@/stores/account-store';
import { Plus, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export function AccountSectionTradingAccounts() {
  const router = useRouter();
  const { selectedAccountId, setSelectedAccountId, bumpAccountsRevision } = useAccountStore();
  const { status: billingStatus } = useSubscription();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | undefined>(undefined);
  const [deleting, setDeleting] = useState<Account | undefined>(undefined);

  const maxAccounts = billingStatus?.maxAccounts ?? null;
  const accountCount = accounts.length;
  const atAccountLimit =
    maxAccounts != null && maxAccounts > 0 && accountCount >= maxAccounts;
  const canDeleteAccount = accountCount > 1;

  const loadAccounts = useCallback(async () => {
    try {
      const data = await api.accounts.list();
      setAccounts(data.filter((a) => !a.isArchived));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load journals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  function openCreate() {
    if (atAccountLimit) {
      toast.error(
        `Journal limit reached (${accountCount}/${maxAccounts}). Upgrade your plan to add more journals.`,
      );
      return;
    }
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(account: Account) {
    setEditing(account);
    setFormOpen(true);
  }

  function handleView(account: Account) {
    setSelectedAccountId(account.id);
    router.push('/dashboard');
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api.accounts.remove(deleting.id);
      toast.success('Journal deleted');
      if (selectedAccountId === deleting.id) {
        setSelectedAccountId(null);
      }
      bumpAccountsRevision();
      await loadAccounts();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete journal');
    }
  }

  function handleSaved(saved: Account) {
    bumpAccountsRevision();
    void loadAccounts();
    if (!editing) {
      setSelectedAccountId(saved.id);
    }
  }

  return (
    <div className="space-y-8">
      <AccountSettingsSection title="Journals">
        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm text-slate-600">
                Each journal tracks live, paper, or prop-firm trading separately. Deleting a journal
                permanently removes its trades, screenshots, and related data.
              </p>
              {maxAccounts != null && maxAccounts > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {accountCount}/{maxAccounts} journals used on your plan.
                </p>
              ) : null}
              {!canDeleteAccount && !loading ? (
                <p className="text-xs text-muted-foreground">
                  Your only journal cannot be deleted. Create another journal first, or delete your
                  user account from the Account section.
                </p>
              ) : null}
            </div>
            <Button type="button" size="sm" onClick={openCreate} disabled={atAccountLimit}>
              <Plus className="h-4 w-4" />
              Create journal
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
              <Wallet className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No journals yet.</p>
              <Button type="button" variant="outline" size="sm" onClick={openCreate}>
                Create your first journal
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onView={() => handleView(account)}
                  onEdit={() => openEdit(account)}
                  onDelete={() => {
                    if (!canDeleteAccount) {
                      toast.error(
                        'Cannot delete your only journal. Create another journal first.',
                      );
                      return;
                    }
                    setDeleting(account);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </AccountSettingsSection>

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={editing}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title="Delete this journal?"
        description={
          deleting
            ? `${deleting.name} and all of its trades, screenshots, and related data will be permanently removed. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete journal"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
