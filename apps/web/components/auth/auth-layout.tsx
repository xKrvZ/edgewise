import { AuthBrandPanel } from '@/components/auth/auth-brand-panel';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-white antialiased lg:h-dvh lg:flex-row lg:overflow-hidden">
      <div className="shrink-0 lg:hidden">
        <AuthBrandPanel compact />
      </div>

      <aside className="relative hidden lg:flex lg:h-full lg:w-1/2 lg:shrink-0">
        <AuthBrandPanel />
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-8 sm:px-8 sm:py-10 lg:h-full lg:w-1/2 lg:overflow-y-auto lg:px-10 xl:px-14">
        {children}
      </main>
    </div>
  );
}
