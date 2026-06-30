'use client';

import { CommunityListShell } from '@/components/community/community-list-shell';
import { CommunityListProvider } from '@/components/community/community-list-context';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

function isCommunityListRoute(pathname: string): boolean {
  return (
    pathname === '/community' ||
    pathname === '/community/discover' ||
    pathname === '/community/invitations'
  );
}

export default function CommunityLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (!isCommunityListRoute(pathname)) {
    return children;
  }

  return (
    <CommunityListProvider>
      <CommunityListShell>{children}</CommunityListShell>
    </CommunityListProvider>
  );
}
