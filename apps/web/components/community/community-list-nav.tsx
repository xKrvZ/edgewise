'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface CommunityListNavProps {
  memberCount: number;
  discoverCount: number;
  pendingCount: number;
}

type ListTab = 'discover' | 'mine' | 'invitations';

function resolveActiveTab(pathname: string): ListTab {
  if (pathname === '/community/discover') {
    return 'discover';
  }

  if (pathname === '/community/invitations') {
    return 'invitations';
  }

  return 'mine';
}

export function CommunityListNav({
  memberCount,
  discoverCount,
  pendingCount,
}: CommunityListNavProps) {
  const pathname = usePathname();
  const activeTab = resolveActiveTab(pathname);

  return (
    <Tabs value={activeTab} className="w-fit">
      <TabsList className="h-auto w-fit max-w-full justify-start gap-1 p-1">
        <TabsTrigger value="discover" asChild className="px-3.5 py-1.5">
          <Link href="/community/discover">
            Discover
            {discoverCount > 0 ? (
              <span className="text-muted-foreground">({discoverCount})</span>
            ) : null}
          </Link>
        </TabsTrigger>
        <TabsTrigger value="mine" asChild className="px-3.5 py-1.5">
          <Link href="/community">
            My communities
            {memberCount > 0 ? (
              <span className="text-muted-foreground">({memberCount})</span>
            ) : null}
          </Link>
        </TabsTrigger>
        <TabsTrigger value="invitations" asChild className="px-3.5 py-1.5">
          <Link href="/community/invitations">
            Pending invitations
            {pendingCount > 0 ? (
              <span className="text-muted-foreground">({pendingCount})</span>
            ) : null}
          </Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
