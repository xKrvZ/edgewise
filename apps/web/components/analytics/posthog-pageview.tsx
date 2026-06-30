'use client';

import { capturePageView } from '@/lib/posthog';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/** Sends SPA $pageview events on App Router navigations (PostHog init disables automatic pageviews). */
export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    capturePageView(url);
  }, [pathname, searchParams]);

  return null;
}
