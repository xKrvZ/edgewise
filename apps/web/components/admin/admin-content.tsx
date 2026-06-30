'use client';

import { BreadcrumbProvider } from '@/components/app/breadcrumb-context';
import { AppTopHeader } from '@/components/app/app-top-header';
import type { ReactNode } from 'react';

export function AdminContent({ children }: { children: ReactNode }) {
  return (
    <BreadcrumbProvider>
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <AppTopHeader />
      <div
        data-app-scroll
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain pb-10 sm:pb-12"
      >
        <div className="mx-auto w-full max-w-screen-2xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          {children}
        </div>
      </div>
    </main>
    </BreadcrumbProvider>
  );
}
