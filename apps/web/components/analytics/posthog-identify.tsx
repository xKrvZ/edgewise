'use client';

import { useSession } from '@/lib/auth-client';
import { useSubscription } from '@/lib/hooks/use-subscription';
import {
  identifyAnalyticsUser,
  resetAnalyticsUser,
  setPersonProperties,
  type BillingPlanSlug,
} from '@/lib/posthog';
import { useEffect, useRef } from 'react';

/** Links PostHog person records to the Better Auth session when available. */
export function PostHogIdentify() {
  const { data: session } = useSession();
  const { status } = useSubscription();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const user = session?.user;
    const userId = user?.id ?? null;
    const previousUserId = previousUserIdRef.current;
    previousUserIdRef.current = userId;

    if (userId && user) {
      const rawRole = (user as { role?: string | string[] | null }).role;
      const role =
        typeof rawRole === 'string' ? rawRole : Array.isArray(rawRole) ? rawRole.join(',') : undefined;

      identifyAnalyticsUser({
        id: userId,
        email: user.email,
        name: user.name,
        role: role ?? null,
        plan: (status?.planId as BillingPlanSlug | undefined) ?? 'none',
      });

      if (status?.planId) {
        setPersonProperties({
          plan: status.planId,
          subscription_active: status.active,
        });
      }

      return;
    }

    if (previousUserId) {
      resetAnalyticsUser();
    }
  }, [
    session?.user,
    session?.user?.email,
    session?.user?.id,
    session?.user?.name,
    status?.active,
    status?.planId,
  ]);

  return null;
}
