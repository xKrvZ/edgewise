'use client';

import { UserMenu } from '@/components/app/user-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';

export function ShareNavActions() {
  const { data: session, isPending } = useSession();
  const isAuthenticated = Boolean(session?.user);

  if (isPending) {
    return <Skeleton className="h-8 w-28 rounded-xl" />;
  }

  if (isAuthenticated) {
    return <UserMenu variant="marketing" />;
  }

  return (
    <Link
      href="/"
      className="inline-flex shrink-0 items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 sm:px-5 sm:py-2.5"
    >
      Start journalling
    </Link>
  );
}
