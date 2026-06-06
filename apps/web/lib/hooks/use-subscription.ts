'use client';

import { api } from '@/lib/api-client';
import {
  DEFAULT_ACCESS_FEATURE,
  type PlatformFeature,
  isPlatformFeature,
} from '@/lib/features';
import type { SubscriptionStatus } from '@/lib/types/billing';
import { useCallback, useEffect, useMemo, useState } from 'react';

function checkoutSlug(): string {
  return (
    process.env.NEXT_PUBLIC_POLAR_CHECKOUT_SLUG?.trim() ||
    process.env.NEXT_PUBLIC_POLAR_ENTITLEMENT_SLUG?.trim() ||
    'pro'
  );
}

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const features = await api.billing.features();
      setStatus(features);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
      setStatus({
        active: false,
        provider: 'mock',
        status: 'inactive',
        features: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const features = useMemo(
    () => (status?.features ?? []).filter(isPlatformFeature),
    [status?.features],
  );

  const hasFeature = useCallback(
    (feature: PlatformFeature) => features.includes(feature),
    [features],
  );

  return {
    status,
    features,
    hasFeature,
    isSubscribed: status?.active ?? hasFeature(DEFAULT_ACCESS_FEATURE),
    isLoading,
    error,
    refetch,
    checkoutSlug: checkoutSlug(),
  };
}
