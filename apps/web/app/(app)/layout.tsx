import { AppContent } from '@/components/app/app-content';
import { AppShell } from '@/components/app/app-shell';
import { Sidebar } from '@/components/app/sidebar';
import { AuthGuard } from '@/components/auth/auth-guard';
import { SubscriptionGuard } from '@/components/auth/subscription-guard';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <AuthGuard>
          <SubscriptionGuard>
            <AppShell>
              <div className="flex h-dvh overflow-hidden bg-background">
                <Sidebar />
                <AppContent>{children}</AppContent>
              </div>
            </AppShell>
          </SubscriptionGuard>
        </AuthGuard>
      </Suspense>
    </TooltipProvider>
  );
}
