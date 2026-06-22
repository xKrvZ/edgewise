'use client';

import { signOut, useSession } from '@/lib/auth-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useEffect, useRef, useState } from 'react';

const SESSION_CHECK_TIMEOUT_MS = 10_000;

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, isPending, error } = useSession();
  const [timedOut, setTimedOut] = useState(false);
  const redirectingRef = useRef(false);

  useEffect(() => {
    const id = window.setTimeout(() => setTimedOut(true), SESSION_CHECK_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, []);

  const checkingSession = isPending && !timedOut && !error;
  const isAuthenticated = Boolean(session?.user);

  useEffect(() => {
    if (checkingSession || isAuthenticated || redirectingRef.current) {
      return;
    }

    redirectingRef.current = true;

    const query = searchParams.toString();
    const callbackUrl = `${pathname}${query ? `?${query}` : ''}`;
    const signInUrl = `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`;

    void signOut().finally(() => {
      router.replace(signInUrl);
    });
  }, [checkingSession, isAuthenticated, pathname, router, searchParams]);

  if (checkingSession) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-muted-foreground">
        Redirecting to sign in…
      </div>
    );
  }

  return children;
}
