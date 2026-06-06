'use client';

import { SubscriptionPaywallOverlay } from '@/components/auth/subscription-paywall-overlay';
import { isSubscriptionExemptRoute } from '@/lib/auth-routes';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isExempt = isSubscriptionExemptRoute(pathname);

  if (isExempt) {
    return children;
  }

  return <SubscriptionPaywallOverlay>{children}</SubscriptionPaywallOverlay>;
}
