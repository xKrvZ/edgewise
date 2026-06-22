'use client';

import { AccountSettingsRow } from '@/components/account/account-settings-row';
import { AccountSettingsSection } from '@/components/account/account-settings-section';
import { AdminAccountLimitSection } from '@/components/admin/admin-account-limit-section';
import { AdminInvoiceTable } from '@/components/admin/admin-invoice-table';
import { AdminSubscriptionSection } from '@/components/admin/admin-subscription-section';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError, api } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { userDisplayName } from '@/lib/user-display';
import type { AdminUserDetail } from '@/lib/types/admin';
import type { InvoiceRow } from '@/lib/types/billing';
import { ALL_ROLES } from '@/lib/roles';
import { Ban, CheckCircle2, Copy, Shield, UserCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AdminUserDetailPanelProps {
  userId: string;
}

export function AdminUserDetailPanel({ userId }: AdminUserDetailPanelProps) {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [roleSaving, setRoleSaving] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const detail = await api.admin.users.get(userId);
      setUser(detail);
      setSelectedRole(detail.role ?? 'User');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const loadInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const page = await api.admin.users.invoices(userId);
      setInvoices(page.items);
    } catch (err) {
      setInvoices([]);
      if (!(err instanceof ApiError)) {
        toast.error('Failed to load invoices');
      }
    } finally {
      setInvoicesLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadUser();
    void loadInvoices();
  }, [loadUser, loadInvoices]);

  async function copyUserId() {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.id);
      toast.success('User ID copied');
    } catch {
      toast.error('Could not copy user ID');
    }
  }

  async function saveRole() {
    if (!user || selectedRole === (user.role ?? 'User')) return;
    setRoleSaving(true);
    try {
      const updated = await api.admin.users.updateRole(user.id, selectedRole);
      setUser(updated);
      toast.success('Role updated');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update role');
    } finally {
      setRoleSaving(false);
    }
  }

  async function confirmBan() {
    if (!user) return;
    const updated = await api.admin.users.ban(user.id);
    setUser(updated);
    toast.success('User banned');
  }

  async function confirmUnban() {
    if (!user) return;
    const updated = await api.admin.users.unban(user.id);
    setUser(updated);
    toast.success('User unbanned');
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading user…</p>;
  }

  if (error || !user) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error ?? 'User not found'}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AccountSettingsSection title="Profile">
        <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-5 sm:px-5">
          <UserAvatar
            displayName={user.displayName}
            name={user.name}
            email={user.email}
            image={user.image}
            className="h-14 w-14"
          />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-semibold text-slate-900">
                {userDisplayName({
                  displayName: user.displayName,
                  name: user.name,
                  email: user.email,
                })}
              </p>
              {user.emailVerified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="secondary">Unverified</Badge>
              )}
              {user.banned ? <Badge variant="destructive">Banned</Badge> : null}
            </div>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
            <p className="text-xs text-slate-400">Joined {formatDate(user.createdAt)}</p>
          </div>
        </div>
        <AccountSettingsRow
          icon={UserCircle}
          label="User ID"
          value={<span className="font-mono text-xs break-all">{user.id}</span>}
          actions={
            <Button type="button" variant="outline" size="sm" onClick={() => void copyUserId()}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          }
        />
      </AccountSettingsSection>

      <AccountSettingsSection title="Role">
        <AccountSettingsRow
          icon={Shield}
          label="Platform role"
          badge={
            user.role
              ? { label: user.role, variant: 'secondary' }
              : { label: 'User', variant: 'secondary' }
          }
          description="Controls admin access and elevated permissions."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="min-w-[10rem]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                disabled={roleSaving || selectedRole === (user.role ?? 'User')}
                onClick={() => void saveRole()}
              >
                {roleSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          }
        />
      </AccountSettingsSection>

      <AccountSettingsSection title="Subscription">
        <AdminSubscriptionSection userId={userId} />
      </AccountSettingsSection>

      <AccountSettingsSection title="Trading accounts">
        <AdminAccountLimitSection
          userId={userId}
          quota={user.accountQuota}
          onUpdated={setUser}
        />
      </AccountSettingsSection>

      <AccountSettingsSection title="Invoices">
        <AdminInvoiceTable
          userId={userId}
          invoices={invoices}
          isLoading={invoicesLoading}
          emptyMessage="No invoices for this user."
          mockHint={
            user.subscription.provider === 'mock'
              ? 'Sample invoices are shown when mock billing is enabled on the API.'
              : undefined
          }
          onInvoiceRefunded={() => void loadInvoices()}
        />
      </AccountSettingsSection>

      <AccountSettingsSection title="Account actions">
        <AccountSettingsRow
          icon={user.banned ? CheckCircle2 : Ban}
          label={user.banned ? 'Banned account' : 'Ban user'}
          description={
            user.banned
              ? user.banReason
                ? `Reason: ${user.banReason}`
                : 'This user cannot sign in until unbanned.'
              : 'Prevent the user from signing in.'
          }
          actions={
            user.banned ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setUnbanDialogOpen(true)}>
                Unban
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setBanDialogOpen(true)}
              >
                Ban user
              </Button>
            )
          }
        />
      </AccountSettingsSection>

      <ConfirmDialog
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
        title="Ban this user?"
        description="They will be signed out and unable to access the platform until unbanned."
        confirmLabel="Ban user"
        onConfirm={confirmBan}
      />

      <ConfirmDialog
        open={unbanDialogOpen}
        onOpenChange={setUnbanDialogOpen}
        title="Unban this user?"
        description="They will be able to sign in again."
        confirmLabel="Unban"
        destructive={false}
        onConfirm={confirmUnban}
      />
    </div>
  );
}
