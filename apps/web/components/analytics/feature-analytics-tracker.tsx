'use client';

import { captureFeatureUsed, type FeatureName } from '@/lib/posthog';
import { useEffect, useRef } from 'react';

interface FeatureAnalyticsTrackerProps {
  feature: FeatureName;
  action?: string;
}

/** Fires `feature_used` once per mount for adoption tracking on key product surfaces. */
export function FeatureAnalyticsTracker({ feature, action }: FeatureAnalyticsTrackerProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) {
      return;
    }

    firedRef.current = true;
    captureFeatureUsed(feature, action ? { action } : undefined);
  }, [action, feature]);

  return null;
}
