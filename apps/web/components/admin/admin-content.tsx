'use client';

import { AppTopHeader } from '@/components/app/app-top-header';
import type { ReactNode } from 'react';

export function AdminContent({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <AppTopHeader />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col px-4 py-6 pb-8 sm:px-6 sm:py-8 sm:pb-10 lg:px-8">
          {children}
        </div>
      </div>
    </main>
  );
}
