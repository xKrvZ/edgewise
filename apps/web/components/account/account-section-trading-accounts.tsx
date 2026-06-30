'use client';

import { AccountHubStatCard } from '@/components/account/account-hub-stat-card';
import { AccountHubTipBanner } from '@/components/account/account-hub-tip-banner';
import {
  AccountCard,
  AccountListColGroup,
  AccountListHeader,
  AccountListRow,
} from '@/components/accounts/account-card';
import { AccountFormDialog } from '@/components/accounts/account-form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, api } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format';
import { useSubscription } from '@/lib/hooks/use-subscription';
import type { Account, AccountType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAccountStore } from '@/stores/account-store';
import { BookOpen, LayoutGrid, List, Plus, Search, Target, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type JournalView = 'grid' | 'list';
type JournalTypeFilter = 'all' | AccountType;
type JournalSort = 'newest' | 'oldest' | 'name' | 'balance';

interface AccountSectionTradingAccountsProps {
  onRegisterHeaderActions?: (actions: React.ReactNode) => void;
}

export function AccountSectionTradingAccounts({
  onRegisterHeaderActions,
}: AccountSectionTradingAccountsProps) {
  const router = useRouter();
  const { selectedAccountId, setSelectedAccountId, bumpAccountsRevision } = useAccountStore();
  const { status: billingStatus } = useSubscription();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | undefined>(undefined);
  const [deleting, setDeleting] = useState<Account | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<JournalTypeFilter>('all');
  const [sort, setSort] = useState<JournalSort>('newest');
  const [view, setView] = useState<JournalView>('grid');
  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const effectiveView: JournalView = isMobile ? 'grid' : view;

  const openCreate = useCallback(() => {
    if (atAccountLimit) {
      toast.error(
        `Journal limit reached (${accountCount}/${maxAccounts}). Upgrade your plan to add more journals.`,
      );
      return;
    }
    setEditing(undefined);
    setFormOpen(true);
  }, [atAccountLimit, accountCount, maxAccounts]);

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

  function handleDelete(account: Account) {
    if (!canDeleteAccount) {
      toast.error('Cannot delete your only journal. Create another journal first.');
      return;
    }
    setDeleting(account);
  }

  const stats = useMemo(() => {
    const liveCount = accounts.filter((a) => a.type === 'live').length;
    const propCount = accounts.filter((a) => a.type === 'prop').length;
    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
    return { liveCount, propCount, totalBalance };
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = accounts.filter((account) => {
      if (typeFilter !== 'all' && account.type !== typeFilter) return false;
      if (!query) return true;
      const haystack = [account.name, account.broker, account.firmName, account.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'balance':
          return b.currentBalance - a.currentBalance;
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return result;
  }, [accounts, search, sort, typeFilter]);

  useEffect(() => {
    onRegisterHeaderActions?.(
      <Button type="button" onClick={openCreate} disabled={atAccountLimit}>
        <Plus className="h-4 w-4" />
        Create journal
      </Button>,
    );
    return () => onRegisterHeaderActions?.(null);
  }, [atAccountLimit, onRegisterHeaderActions, openCreate]);

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <AccountHubStatCard
          label="Total journals"
          value={loading ? '—' : String(accountCount)}
          subtext="Across all accounts"
          icon={BookOpen}
        />
        <AccountHubStatCard
          label="Live"
          value={loading ? '—' : String(stats.liveCount)}
          subtext="Active journals"
          icon={Target}
          iconClassName="bg-emerald-50 text-emerald-600"
        />
        <AccountHubStatCard
          label="Prop / Challenge"
          value={loading ? '—' : String(stats.propCount)}
          subtext="Tracking progress"
          icon={Target}
          iconClassName="bg-primary/10 text-primary"
        />
        <AccountHubStatCard
          label="Total balance"
          value={loading ? '—' : formatCurrency(stats.totalBalance)}
          subtext="Combined"
          icon={Wallet}
          iconClassName="bg-slate-100 text-slate-600"
        />
      </div>

      <AccountHubTipBanner
        title="Tip: Journals are independent"
        description="Each journal tracks trades, screenshots, notes and analytics separately. Deleting a journal cannot be undone."
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 w-full sm:flex-1 sm:basis-0 sm:min-w-[200px]">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search journals..."
            className="h-9 w-full border-slate-200 bg-white pl-9"
          />
        </div>

        <div className="flex w-full min-w-0 gap-2 sm:contents">
          <div className="min-w-0 flex-1 sm:flex-none">
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as JournalTypeFilter)}
            >
              <SelectTrigger className="h-9 w-full min-w-0 border-slate-200 bg-white sm:w-auto sm:min-w-[8.5rem] sm:shrink-0">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="paper">Paper</SelectItem>
                <SelectItem value="prop">Prop / Challenge</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 flex-1 sm:flex-none">
            <Select value={sort} onValueChange={(value) => setSort(value as JournalSort)}>
              <SelectTrigger className="h-9 w-full min-w-0 border-slate-200 bg-white sm:w-auto sm:min-w-[9.5rem] sm:shrink-0">
                <SelectValue placeholder="Newest first" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
                <SelectItem value="balance">Highest balance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          role="group"
          aria-label="Journal view"
          className="hidden h-9 shrink-0 items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 sm:inline-flex"
        >
            {(
              [
                { value: 'grid' as const, icon: LayoutGrid, label: 'Grid view' },
                { value: 'list' as const, icon: List, label: 'List view' },
              ] as const
            ).map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                aria-pressed={view === value}
                aria-label={label}
                className={cn(
                  'h-8 w-8 shrink-0 rounded-md p-0',
                  view === value
                    ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                    : 'text-slate-500 hover:text-slate-900',
                )}
                onClick={() => setView(value)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
        </div>
      </div>

      {maxAccounts != null && maxAccounts > 0 ? (
        <p className="text-xs text-slate-500">
          {accountCount}/{maxAccounts} journals used on your plan.
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <Wallet className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">No journals yet.</p>
          <Button type="button" variant="outline" size="sm" onClick={openCreate}>
            Create your first journal
          </Button>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
          No journals match your search or filters.
        </div>
      ) : effectiveView === 'grid' ? (
        <div className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onView={() => handleView(account)}
              onEdit={() => openEdit(account)}
              onDelete={() => handleDelete(account)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full sm:table-fixed">
            <AccountListColGroup />
            <AccountListHeader />
            <tbody className="block sm:table-row-group">
              {filteredAccounts.map((account) => (
                <AccountListRow
                  key={account.id}
                  account={account}
                  onView={() => handleView(account)}
                  onEdit={() => openEdit(account)}
                  onDelete={() => handleDelete(account)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

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
