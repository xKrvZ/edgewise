'use client';

import { useSession } from '@/lib/auth-client';
import { isAdministrator } from '@/lib/roles';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const hasRedirected = useRef(false);

  const userRole = session?.user?.role as string | string[] | null | undefined;
  const isAdmin = isAdministrator(userRole);

  useEffect(() => {
    if (isPending || !session || isAdmin || hasRedirected.current) {
      return;
    }

    hasRedirected.current = true;
    toast.error('Administrator access required');
    router.replace('/dashboard');
  }, [isAdmin, isPending, router, session]);

  if (isPending) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-muted-foreground">
        Checking permissions…
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-muted-foreground">
        Redirecting…
      </div>
    );
  }

  return children;
}
