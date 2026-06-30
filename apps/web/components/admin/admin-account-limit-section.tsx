'use client';

import { AccountSettingsRow } from '@/components/account/account-settings-row';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPlanLabel } from '@/lib/billing-plans';
import { ApiError, api } from '@/lib/api-client';
import type { AdminUserAccountQuota, AdminUserDetail } from '@/lib/types/admin';
import { Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AdminAccountLimitSectionProps {
  userId: string;
  quota: AdminUserAccountQuota;
  onUpdated: (user: AdminUserDetail) => void;
}

export function AdminAccountLimitSection({
  userId,
  quota,
  onUpdated,
}: AdminAccountLimitSectionProps) {
  const [overrideInput, setOverrideInput] = useState('');
  const [useOverride, setUseOverride] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUseOverride(quota.maxTradingAccountsOverride != null);
    setOverrideInput(
      quota.maxTradingAccountsOverride != null
        ? String(quota.maxTradingAccountsOverride)
        : String(quota.planMaxAccounts),
    );
  }, [quota]);

  async function saveLimit() {
    setSaving(true);
    try {
      const body = useOverride
        ? Number.parseInt(overrideInput, 10)
        : null;

      if (useOverride) {
        if (!Number.isInteger(body) || (body ?? 0) < 0 || (body ?? 0) > 500) {
          toast.error('Override must be a whole number between 0 and 500');
          return;
        }
      }

      const updated = await api.admin.users.updateAccountLimit(userId, body);
      onUpdated(updated);
      toast.success(useOverride ? 'Account limit override saved' : 'Using plan default again');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update account limit');
    } finally {
      setSaving(false);
    }
  }

  const planLabel = formatPlanLabel(quota.planId) ?? 'No plan';
  const hasOverride = quota.maxTradingAccountsOverride != null;

  return (
    <AccountSettingsRow
      icon={Wallet}
      label="Trading account limit"
      badge={{
        label: `${quota.accountCount}/${quota.maxAccounts} used`,
        variant: quota.accountCount >= quota.maxAccounts ? 'warning' : 'secondary',
      }}
      description={
        hasOverride
          ? `Override active (${quota.maxAccounts} max). Plan default for ${planLabel}: ${quota.planMaxAccounts}.`
          : `${planLabel} includes up to ${quota.planMaxAccounts} trading accounts.`
      }
      actions={
        <div className="flex w-full max-w-md flex-col gap-3 sm:items-end">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={useOverride}
              onChange={(event) => setUseOverride(event.target.checked)}
              className="rounded border-border"
            />
            Custom limit override
          </label>
          {useOverride ? (
            <div className="flex w-full flex-wrap items-center gap-2 sm:justify-end">
              <Input
                type="number"
                min={0}
                max={500}
                step={1}
                value={overrideInput}
                onChange={(event) => setOverrideInput(event.target.value)}
                className="w-full sm:w-32"
                aria-label="Max trading accounts override"
              />
              <Button type="button" size="sm" disabled={saving} onClick={() => void saveLimit()}>
                {saving ? 'Saving…' : 'Save limit'}
              </Button>
            </div>
          ) : (
            <Button type="button" size="sm" disabled={saving} onClick={() => void saveLimit()}>
              {saving ? 'Saving…' : 'Save limit'}
            </Button>
          )}
        </div>
      }
    />
  );
}
