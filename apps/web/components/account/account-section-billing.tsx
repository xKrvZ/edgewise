'use client';

import { AccountSettingsRow } from '@/components/account/account-settings-row';
import { AccountSettingsSection } from '@/components/account/account-settings-section';
import { InvoiceTable } from '@/components/billing/invoice-table';
import { Button } from '@/components/ui/button';
import { ApiError, api } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { formatPlanLabel, BILLING_PLAN_LABELS } from '@/lib/billing-plans';
import { formatFeatureList } from '@/lib/features';
import type { InvoiceRow } from '@/lib/types/billing';
import { CreditCard, ExternalLink, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

function isMockBilling(): boolean {
  const provider = (process.env.NEXT_PUBLIC_BILLING_PROVIDER ?? '').toLowerCase();
  return provider === 'mock' || provider === '';
}

export function AccountSectionBilling() {
  const { status, isSubscribed, isLoading, refetch, checkoutSlug, features } = useSubscription();
  const [actionLoading, setActionLoading] = useState<'checkout' | 'portal' | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  const isMock = status?.provider === 'mock' || isMockBilling();

  const loadInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const page = await api.billing.invoices();
      setInvoices(page.items);
    } catch (err) {
      setInvoices([]);
      if (!(err instanceof ApiError) || err.status !== 401) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to load invoices');
      }
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const openPolar = async (mode: 'checkout' | 'portal') => {
    if (isMock) {
      toast.error('Polar billing is not configured for local development.');
      return;
    }

    setActionLoading(mode);
    try {
      if (mode === 'checkout') {
        await authClient.checkout({ slug: checkoutSlug });
      } else {
        await authClient.customer.portal();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open billing');
    } finally {
      setActionLoading(null);
    }
  };

  const planLabel = isLoading
    ? 'Loading…'
    : isSubscribed && status?.planId && status.planId !== 'none'
      ? `Edgewise ${BILLING_PLAN_LABELS[status.planId]}`
      : isSubscribed
        ? 'Edgewise'
        : 'No active plan';

  const renewalText =
    status?.currentPeriodEnd && isSubscribed
      ? `Renews ${new Date(status.currentPeriodEnd).toLocaleDateString()}`
      : undefined;

  const featuresText =
    features.length > 0 ? `Features: ${formatFeatureList(features)}` : undefined;

  const accountLimitText =
    status?.maxAccounts != null && status.maxAccounts > 0
      ? `${status.accountCount ?? 0} of ${status.maxAccounts} journals used`
      : undefined;

  const aiReviewTokenText = status?.aiReviewTokensUnlimited
    ? 'Unlimited AI review tokens'
    : status?.aiReviewTokensLimit != null && status.aiReviewTokensLimit > 0
      ? `${status.aiReviewTokensRemaining ?? status.aiReviewTokensLimit} of ${status.aiReviewTokensLimit} AI review tokens left this month`
      : undefined;

  const planIdLabel = formatPlanLabel(status?.planId);

  return (
    <div className="space-y-8">
      {!isSubscribed && !isLoading ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          Your subscription is inactive. Subscribe to access the dashboard, trades, analytics, and
          journals.
        </p>
      ) : null}

      {isMock ? (
        <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          Mock billing is enabled for local development — all users are treated as subscribed. Sample
          invoices are shown below.
        </p>
      ) : null}

      <AccountSettingsSection title="Plan">
        <AccountSettingsRow
          icon={CreditCard}
          label="Subscription"
          badge={
            isLoading
              ? undefined
              : isSubscribed
                ? { label: 'Active', variant: 'success' }
                : { label: 'Inactive', variant: 'secondary' }
          }
          value={planLabel}
          description={renewalText ?? accountLimitText ?? featuresText}
          actions={
            isSubscribed && status?.polarCustomerId && !isMock ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-[5.5rem] font-semibold tracking-wide uppercase"
                disabled={actionLoading !== null || isLoading}
                onClick={() => void openPolar('portal')}
              >
                {actionLoading === 'portal' ? 'Opening…' : 'Manage'}
              </Button>
            ) : !isSubscribed && !isMock ? (
              <Button
                type="button"
                size="sm"
                className="min-w-[5.5rem] font-semibold tracking-wide uppercase"
                disabled={actionLoading !== null || isLoading}
                onClick={() => void openPolar('checkout')}
              >
                {actionLoading === 'checkout' ? 'Opening…' : 'Subscribe'}
              </Button>
            ) : undefined
          }
        />
        {isSubscribed && !status?.polarCustomerId && !isMock ? (
          <AccountSettingsRow
            icon={Sparkles}
            label="Checkout setup"
            description="Complete Polar checkout to manage billing and invoices."
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-[5.5rem] font-semibold tracking-wide uppercase"
                disabled={actionLoading !== null}
                onClick={() => void openPolar('checkout')}
              >
                {actionLoading === 'checkout' ? 'Opening…' : 'Complete'}
              </Button>
            }
          />
        ) : null}
        {isSubscribed && accountLimitText ? (
          <AccountSettingsRow
            icon={Sparkles}
            label="Journals"
            value={planIdLabel ?? 'Included'}
            description={`${accountLimitText}. Each plan includes a fixed number of trade journals; upgrade to add more.`}
          />
        ) : null}
        {isSubscribed && aiReviewTokenText ? (
          <AccountSettingsRow
            icon={Sparkles}
            label="AI review tokens"
            value={planIdLabel ?? 'Included'}
            description={`${aiReviewTokenText}. On-demand trade reviews consume one token each.`}
          />
        ) : null}
      </AccountSettingsSection>

      <AccountSettingsSection title="Billing">
        <AccountSettingsRow
          icon={ExternalLink}
          label="Billing portal"
          description="Update payment method, view invoices, and cancel through Polar."
          actions={
            isSubscribed && status?.polarCustomerId && !isMock ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-[5.5rem] font-semibold tracking-wide uppercase"
                disabled={actionLoading !== null}
                onClick={() => void openPolar('portal')}
              >
                {actionLoading === 'portal' ? 'Opening…' : 'Open'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-[5.5rem] font-semibold tracking-wide uppercase"
                disabled={isLoading}
                onClick={() => void refetch()}
              >
                Refresh
              </Button>
            )
          }
        />
      </AccountSettingsSection>

      <AccountSettingsSection title="Invoices">
        <InvoiceTable
          invoices={invoices}
          isLoading={invoicesLoading}
          emptyMessage={
            isMock
              ? 'No sample invoices available.'
              : 'No invoices yet. Invoices appear here after your first Polar payment.'
          }
          mockHint={
            isMock
              ? 'Connect Polar (BILLING_PROVIDER=polar) to load real invoices from your organization.'
              : undefined
          }
        />
      </AccountSettingsSection>
    </div>
  );
}
