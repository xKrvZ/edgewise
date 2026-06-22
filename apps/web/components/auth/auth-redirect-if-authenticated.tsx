'use client';

import { useSession } from '@/lib/auth-client';
import { resolvePostAuthRedirect } from '@/lib/auth-utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';

const SESSION_CHECK_TIMEOUT_MS = 10_000;

export function AuthRedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const postAuthRedirect = resolvePostAuthRedirect(callbackUrl);
  const { data: session, isPending, error } = useSession();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setTimedOut(true), SESSION_CHECK_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    router.replace(postAuthRedirect);
  }, [postAuthRedirect, router, session]);

  const checkingSession = isPending && !timedOut && !error;

  if (checkingSession) {
    return (
      <div className="flex w-full max-w-md items-center justify-center py-12 text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  if (session?.user) {
    return null;
  }

  return children;
}
