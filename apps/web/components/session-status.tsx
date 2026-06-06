'use client';

import { signOut, useSession } from '@/lib/auth-client';
import { useUserDisplayLabel } from '@/lib/hooks/use-user-display-label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function SessionStatus() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { label: displayLabel } = useUserDisplayLabel();

  if (isPending) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
        <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
        Loading session…
      </span>
    );
  }

  if (!session) {
    return (
      <Link
        href="/sign-in"
        className="rounded-md border border-border bg-card/60 px-4 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground"
      >
        Sign in
      </Link>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <span className="inline-flex items-center gap-3 rounded-full border border-border bg-card py-1.5 pr-1.5 pl-4 text-sm text-muted-foreground">
      Signed in as{' '}
      <span className="font-medium text-foreground">{displayLabel}</span>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition hover:bg-accent hover:text-accent-foreground"
      >
        Sign out
      </button>
    </span>
  );
}
