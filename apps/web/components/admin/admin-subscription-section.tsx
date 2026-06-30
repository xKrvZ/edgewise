'use client';

import { AccountSettingsRow } from '@/components/account/account-settings-row';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ApiError, api } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { formatFeatureList } from '@/lib/features';
import type { AdminSubscriptionDetail } from '@/lib/types/admin';
import { CreditCard, ExternalLink, ShieldOff } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AdminSubscriptionSectionProps {
  userId: string;
}

export function AdminSubscriptionSection({ userId }: AdminSubscriptionSectionProps) {
  const [subscription, setSubscription] = useState<AdminSubscriptionDetail | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [excludeBilling, setExcludeBilling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [planSaving, setPlanSaving] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelImmediateDialogOpen, setCancelImmediateDialogOpen] = useState(false);

  const loadSubscription = useCallback(async () => {
    setIsLoading(true);
    try {
      const detail = await api.admin.users.subscription(userId);
      setSubscription(detail);
      setSelectedPlan(detail.planSlug ?? detail.productId ?? '');
      setExcludeBilling(detail.adminPlanOverride ?? false);
    } catch (err) {
      setSubscription(null);
      if (!(err instanceof ApiError)) {
        toast.error('Failed to load subscription');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  async function savePlan() {
    if (!subscription || !selectedPlan) return;
    const currentPlan = subscription.planSlug ?? subscription.productId ?? '';
    if (selectedPlan === currentPlan) return;

    setPlanSaving(true);
    try {
      const plan = subscription.plans.find(
        (entry) => (entry.slug ?? entry.productId ?? entry.id) === selectedPlan,
      );
      const updated = await api.admin.users.changePlan(userId, {
        planSlug: plan?.slug ?? undefined,
        productId: plan?.productId ?? (plan ? undefined : selectedPlan),
        excludeBilling: excludeBilling || undefined,
      });
      setSubscription(updated);
      setSelectedPlan(updated.planSlug ?? updated.productId ?? '');
      setExcludeBilling(updated.adminPlanOverride ?? false);
      toast.success(
        excludeBilling ? 'Plan updated without billing changes' : 'Plan updated',
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to change plan');
    } finally {
      setPlanSaving(false);
    }
  }

  async function confirmCancel(immediate: boolean) {
    try {
      const updated = await api.admin.users.cancelSubscription(userId, immediate);
      setSubscription(updated);
      setSelectedPlan(updated.planSlug ?? updated.productId ?? '');
      toast.success(immediate ? 'Subscription canceled immediately' : 'Cancellation scheduled');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to cancel subscription');
      throw err;
    }
  }

  if (isLoading) {
    return <p className="px-4 py-3 text-sm text-muted-foreground sm:px-5">Loading subscription…</p>;
  }

  if (!subscription) {
    return (
      <p className="px-4 py-3 text-sm text-destructive sm:px-5">Could not load subscription.</p>
    );
  }

  const subscriptionBadge = subscription.active
    ? subscription.cancelAtPeriodEnd
      ? { label: 'Canceling', variant: 'warning' as const }
      : { label: 'Active', variant: 'success' as const }
    : subscription.status === 'canceled'
      ? { label: 'Canceled', variant: 'warning' as const }
      : { label: 'None', variant: 'secondary' as const };

  const featuresDescription =
    subscription.features.length > 0
      ? `Features: ${formatFeatureList(subscription.features)}`
      : subscription.provider === 'polar'
        ? 'No features enabled.'
        : undefined;

  const currentPlan = subscription.planSlug ?? subscription.productId ?? '';
  const canManage = subscription.managementEnabled;
  const showCancel =
    canManage && (subscription.active || subscription.status === 'active');

  return (
    <>
      {subscription.provider === 'mock' ? (
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground sm:px-5">
          Mock billing is enabled — grant or revoke access, change plans, and test refunds locally.
        </p>
      ) : (
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground sm:px-5">
          Polar billing — change plans, cancel subscriptions, and issue refunds from here.
        </p>
      )}

      <AccountSettingsRow
        icon={CreditCard}
        label="Feature access"
        badge={subscriptionBadge}
        description={
          subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd
            ? `Access until ${formatDate(subscription.currentPeriodEnd)}`
            : subscription.currentPeriodEnd
              ? `Renews ${formatDate(subscription.currentPeriodEnd)}`
              : featuresDescription
        }
        value={subscription.status}
        actions={
          canManage ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger className="min-w-[10rem]">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscription.plans.map((plan) => (
                      <SelectItem
                        key={plan.id}
                        value={plan.slug ?? plan.productId ?? plan.id}
                      >
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  disabled={planSaving || !selectedPlan || selectedPlan === currentPlan}
                  onClick={() => void savePlan()}
                >
                  {planSaving ? 'Saving…' : 'Change plan'}
                </Button>
              </div>
            </div>
          ) : subscription.polarDashboardUrl ? (
            <Button type="button" variant="outline" size="sm" asChild>
              <Link
                href={subscription.polarDashboardUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Open in Polar
              </Link>
            </Button>
          ) : (
            <Badge variant="outline">Billing unavailable</Badge>
          )
        }
      />

      {canManage ? (
        <AccountSettingsRow
          icon={ShieldOff}
          label="Exclude billing"
          badge={
            excludeBilling
              ? { label: 'Active', variant: 'warning' }
              : undefined
          }
          description={
            subscription.provider === 'polar'
              ? 'Update platform access only. Does not change the Polar subscription or charge the customer.'
              : 'Update platform access only. Mock billing never charges Polar.'
          }
          actions={
            <Switch
              checked={excludeBilling}
              onCheckedChange={setExcludeBilling}
              aria-label="Exclude billing"
            />
          }
        />
      ) : null}

      {showCancel ? (
        <AccountSettingsRow
          icon={CreditCard}
          label="Cancel subscription"
          description={
            excludeBilling
              ? 'Disabled while exclude billing is on — cancel in Polar or turn off exclude billing first.'
              : 'Schedule cancellation at period end or revoke access immediately.'
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={excludeBilling}
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel at period end
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={excludeBilling}
                onClick={() => setCancelImmediateDialogOpen(true)}
              >
                Cancel now
              </Button>
            </div>
          }
        />
      ) : null}

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel at period end?"
        description="The user keeps access until the current billing period ends."
        confirmLabel="Schedule cancellation"
        destructive={false}
        onConfirm={() => confirmCancel(false)}
      />

      <ConfirmDialog
        open={cancelImmediateDialogOpen}
        onOpenChange={setCancelImmediateDialogOpen}
        title="Cancel subscription immediately?"
        description="Access will be revoked right away. This cannot be undone from here."
        confirmLabel="Cancel now"
        onConfirm={() => confirmCancel(true)}
      />
    </>
  );
}
