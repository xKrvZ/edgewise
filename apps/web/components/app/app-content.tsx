'use client';

import { AppTopHeader } from '@/components/app/app-top-header';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const IMMERSIVE_ROUTES = ['/replay'];

/** Individual backtest workspace uses full-bleed chart layout. */
const BACKTEST_WORKSPACE_PATTERN = /^\/backtesting\/[^/]+$/;

function isImmersiveRoute(pathname: string): boolean {
  if (BACKTEST_WORKSPACE_PATTERN.test(pathname)) return true;
  return IMMERSIVE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function AppContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const immersive = isImmersiveRoute(pathname);

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {!immersive && <AppTopHeader />}
      <div className={cn('flex min-h-0 flex-1 flex-col', immersive ? 'overflow-hidden' : 'overflow-y-auto')}>
        <div
          className={cn(
            'mx-auto flex w-full flex-1 flex-col',
            immersive
              ? 'min-h-0'
              : 'max-w-screen-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8',
          )}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
