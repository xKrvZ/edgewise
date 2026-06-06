'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Backwards-compatible redirect from legacy /profile URL. */
export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account#profile');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Redirecting…
    </div>
  );
}
