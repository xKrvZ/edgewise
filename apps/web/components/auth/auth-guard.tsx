'use client';

import { useSession } from '@/lib/auth-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending || session) {
      return;
    }

    const query = searchParams.toString();
    const callbackUrl = `${pathname}${query ? `?${query}` : ''}`;
    const signInUrl = `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    router.replace(signInUrl);
  }, [isPending, pathname, router, searchParams, session]);

  if (isPending || !session) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  return children;
}
