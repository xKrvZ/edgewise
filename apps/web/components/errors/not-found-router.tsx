'use client';

import { AppNotFound } from '@/components/errors/app-not-found';
import { MarketingNotFound } from '@/components/errors/marketing-not-found';
import { isAppRoute } from '@/lib/error-routes';
import { usePathname } from 'next/navigation';

/**
 * Root-level 404 fallback (no segment layout shell).
 * Journal, admin, and hub unknown paths are handled by nested `[...slug]` catch-alls
 * that call `notFound()` so the segment `not-found.tsx` renders inside the correct layout.
 */
export function NotFoundRouter() {
  const pathname = usePathname();

  if (isAppRoute(pathname)) {
    return <AppNotFound />;
  }

  return <MarketingNotFound />;
}
