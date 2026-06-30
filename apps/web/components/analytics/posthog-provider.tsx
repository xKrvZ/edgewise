'use client';

import { PostHogErrorBoundary } from '@/components/analytics/posthog-error-boundary';
import { PostHogIdentify } from '@/components/analytics/posthog-identify';
import { PostHogPageView } from '@/components/analytics/posthog-pageview';
import { PostHogSession } from '@/components/analytics/posthog-session';
import { initPostHog, isPostHogConfigured } from '@/lib/posthog';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { Suspense, useEffect, useState, type ReactNode } from 'react';

function PostHogPageViewSuspense() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isPostHogConfigured()) {
      return;
    }

    initPostHog();
    setReady(true);
  }, []);

  if (!ready || !isPostHogConfigured()) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <PostHogPageViewSuspense />
      <PostHogIdentify />
      <PostHogSession />
      <PostHogErrorBoundary>{children}</PostHogErrorBoundary>
    </PHProvider>
  );
}
