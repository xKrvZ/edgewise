'use client';

import { AccountFormDialog } from '@/components/accounts/account-form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/lib/api-client';
import type { Account } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAccountStore } from '@/stores/account-store';
import { ChevronsUpDown, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const ALL = '__all__';

const TYPE_LABELS = {
  live: 'Live',
  paper: 'Paper',
  prop: 'Prop',
} as const;

interface AccountSelectorProps {
  /** Full-width styling for sidebar and mobile drawer. */
  variant?: 'sidebar' | 'compact';
  /** Icon-only trigger when the desktop sidebar is collapsed. */
  collapsed?: boolean;
  className?: string;
}

export function AccountSelector({
  variant = 'sidebar',
  collapsed = false,
  className,
}: AccountSelectorProps) {
  const { selectedAccountId, setSelectedAccountId } = useAccountStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | undefined>(undefined);
  const [deleting, setDeleting] = useState<Account | undefined>(undefined);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await api.accounts.list();
      setAccounts(data.filter((a) => !a.isArchived));
    } catch {
      // Foundation phase: silently ignore (user may be signed out).
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const triggerLabel = selectedAccount?.name ?? 'All accounts';

  function handleSelect(value: string) {
    setSelectedAccountId(value === ALL ? null : value);
    setOpen(false);
  }

  function openCreate() {
    setOpen(false);
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(account: Account) {
    setOpen(false);
    setEditing(account);
    setFormOpen(true);
  }

  function openDelete(account: Account) {
    setOpen(false);
    setDeleting(account);
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api.accounts.remove(deleting.id);
      toast.success('Account deleted');
      if (selectedAccountId === deleting.id) {
        setSelectedAccountId(null);
      }
      await loadAccounts();
    } catch {
      toast.error('Failed to delete account');
    }
  }

  function handleSaved(saved: Account) {
    loadAccounts();
    if (!editing) {
      setSelectedAccountId(saved.id);
    }
  }

  const trigger = (
    <Button
      variant={variant === 'sidebar' ? 'sidebarOutline' : 'outline'}
      size={collapsed ? 'icon' : variant === 'sidebar' ? 'default' : 'sm'}
      className={cn(
        'gap-2 font-normal',
        variant === 'sidebar' &&
          (collapsed
            ? 'h-10 w-10'
            : 'h-10 w-full justify-between px-3'),
        variant !== 'sidebar' && 'h-9 w-[190px] justify-between',
        className,
      )}
      aria-label={`Select account: ${triggerLabel}`}
    >
      {collapsed ? (
        <Wallet className="h-4 w-4 shrink-0" />
      ) : (
        <>
          <span className="flex min-w-0 items-center gap-2">
            <Wallet className="h-4 w-4 shrink-0 text-sidebar-muted-foreground" />
            <span className="truncate text-left text-sm font-medium">{triggerLabel}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-muted-foreground" />
        </>
      )}
    </Button>
  );

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {triggerLabel}
            </TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        )}
        <DropdownMenuContent
          align={variant === 'sidebar' ? 'start' : 'end'}
          side="bottom"
          className={cn(variant === 'sidebar' ? 'w-(--radix-dropdown-menu-trigger-width)' : 'w-56')}
        >
          <DropdownMenuLabel className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Account
          </DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={selectedAccountId === null}
            onCheckedChange={() => handleSelect(ALL)}
          >
            All accounts
          </DropdownMenuCheckboxItem>
          {accounts.length > 0 && <DropdownMenuSeparator />}
          {accounts.map((account) => (
            <DropdownMenuCheckboxItem
              key={account.id}
              checked={selectedAccountId === account.id}
              onCheckedChange={() => handleSelect(account.id)}
              className="pr-1"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate">{account.name}</span>
                <span className="text-xs text-muted-foreground">
                  {TYPE_LABELS[account.type]}
                  {account.broker ? ` · ${account.broker}` : ''}
                </span>
              </span>
            </DropdownMenuCheckboxItem>
          ))}
          {!loading && accounts.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">No accounts yet</p>
          )}
          {selectedAccount && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openEdit(selectedAccount)}>
                <Pencil />
                Edit account
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => openDelete(selectedAccount)}>
                <Trash2 />
                Delete account
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={openCreate}>
            <Plus />
            Create account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={editing}
        onSaved={handleSaved}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Delete this account?"
        description={
          deleting
            ? `${deleting.name} and its trades will be removed. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </>
  );
}
