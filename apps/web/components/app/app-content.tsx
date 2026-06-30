'use client';

import { BreadcrumbProvider } from '@/components/app/breadcrumb-context';
import { AppTopHeader } from '@/components/app/app-top-header';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function AppContent({ children }: { children: ReactNode }) {
  return (
    <BreadcrumbProvider>
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <AppTopHeader />
      <div
        data-app-scroll
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain"
      >
        <div className="mx-auto flex min-h-0 w-full max-w-screen-2xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </div>
      </div>
    </main>
    </BreadcrumbProvider>
  );
}
