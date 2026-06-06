import { AuthGuard } from '@/components/auth/auth-guard';
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

export default function HubLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="marketing flex min-h-screen items-center justify-center bg-[#f7f8fc] text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <AuthGuard>
        <MarketingPageShell>
          <main id="main-content" className="relative z-10">
            {children}
          </main>
        </MarketingPageShell>
      </AuthGuard>
    </Suspense>
  );
}
