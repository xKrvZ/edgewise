import { AdminContent } from '@/components/admin/admin-content';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminGuard } from '@/components/auth/admin-guard';
import { AuthGuard } from '@/components/auth/auth-guard';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
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
          <AdminGuard>
            <div className="flex h-screen overflow-hidden bg-background">
              <AdminSidebar />
              <AdminContent>{children}</AdminContent>
            </div>
          </AdminGuard>
        </AuthGuard>
      </Suspense>
    </TooltipProvider>
  );
}
