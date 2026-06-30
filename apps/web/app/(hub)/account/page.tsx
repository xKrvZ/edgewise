'use client';

import { AccountSectionAccount } from '@/components/account/account-section-account';
import { AccountSectionBilling } from '@/components/account/account-section-billing';
import { AccountSectionProfile } from '@/components/account/account-section-profile';
import { AccountSectionTradingAccounts } from '@/components/account/account-section-trading-accounts';
import { AccountSettingsLayout } from '@/components/account/account-settings-layout';
import { api } from '@/lib/api-client';
import { useAccountSection } from '@/lib/hooks/use-account-section';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { captureSubscriptionSuccess, type BillingPlanSlug } from '@/lib/posthog';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

function AccountPageContent() {
  const { section, setSection, hydrated } = useAccountSection();
  const searchParams = useSearchParams();
  const { refetch } = useSubscription();
  const [headerActions, setHeaderActions] = useState<ReactNode>(null);
  const checkoutCapturedRef = useRef(false);

  useEffect(() => {
    if (searchParams.get('checkout') !== 'success' || checkoutCapturedRef.current) {
      return;
    }

    checkoutCapturedRef.current = true;
    const fromPlan = (searchParams.get('from_plan') as BillingPlanSlug | null) ?? 'none';

    void (async () => {
      try {
        const features = await api.billing.features();
        captureSubscriptionSuccess({
          from_plan: fromPlan,
          to_plan: (features.planId as BillingPlanSlug | undefined) ?? 'starter',
        });
      } catch {
        captureSubscriptionSuccess({ from_plan: fromPlan, to_plan: 'starter' });
      }

      toast.success('Checkout complete — refreshing your subscription status.');
      await refetch();
    })();
  }, [refetch, searchParams]);

  useEffect(() => {
    if (section !== 'trading-accounts') {
      setHeaderActions(null);
    }
  }, [section]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Loading account settings…
      </div>
    );
  }

  return (
    <AccountSettingsLayout
      activeSection={section}
      onSectionChange={setSection}
      headerActions={headerActions}
    >
      {section === 'profile' ? <AccountSectionProfile /> : null}
      {section === 'trading-accounts' ? (
        <AccountSectionTradingAccounts onRegisterHeaderActions={setHeaderActions} />
      ) : null}
      {section === 'account' ? (
        <AccountSectionAccount onGoToProfile={() => setSection('profile')} />
      ) : null}
      {section === 'billing' ? <AccountSectionBilling /> : null}
    </AccountSettingsLayout>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountPageContent />
    </Suspense>
  );
}
