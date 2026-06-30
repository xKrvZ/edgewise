'use client';

import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { isAdministrator } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { CreditCard } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { storeUpgradeContext } from '@/lib/posthog';

type SubscriptionPaywallOverlayProps = {
  children: ReactNode;
};

export function SubscriptionPaywallOverlay({ children }: SubscriptionPaywallOverlayProps) {
  const { data: session } = useSession();
  const { isSubscribed, isLoading } = useSubscription();
  const isAdmin = isAdministrator(
    (session?.user as { role?: string | string[] | null } | undefined)?.role,
  );

  if (isAdmin) {
    return children;
  }

  const showPaywall = !isLoading && !isSubscribed;
  const showBlockingOverlay = isLoading || showPaywall;

  if (isSubscribed) {
    return children;
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div
        className={cn(
          'flex h-full w-full overflow-hidden',
          showBlockingOverlay && 'pointer-events-none select-none',
        )}
        aria-hidden={showBlockingOverlay || undefined}
      >
        {children}
      </div>

      {showBlockingOverlay ? (
        <div
          className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-hidden={isLoading || undefined}
        >
          <div className="absolute inset-0 bg-background/40 backdrop-blur-md dark:bg-background/50" />

          {isLoading ? (
            <p className="relative z-10 text-sm font-medium text-white drop-shadow-sm">
              Checking subscription…
            </p>
          ) : (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="subscription-paywall-title"
              aria-describedby="subscription-paywall-description"
              className="relative z-10 flex w-full max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-950 shadow-2xl sm:p-8"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CreditCard className="h-6 w-6" aria-hidden />
              </div>

              <h2 id="subscription-paywall-title" className="text-xl font-semibold tracking-tight">
                Active subscription required
              </h2>
              <p id="subscription-paywall-description" className="mt-2 text-sm leading-relaxed text-slate-600">
                Subscribe to access your dashboard, trades, analytics, and the rest of the Edgewise
                trading journal.
              </p>

              <div className="mt-6 flex w-full flex-col-reverse items-center justify-center gap-3 sm:flex-row">
                <Button variant="outline" className="border-slate-200" asChild>
                  <Link href="/account">Back to account</Link>
                </Button>
                <Button asChild>
                  <Link
                    href="/account?upgrade_trigger=paywall#billing"
                    onClick={() => storeUpgradeContext('paywall')}
                  >
                    Get started
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
