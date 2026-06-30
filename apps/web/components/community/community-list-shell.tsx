'use client';

import { CommunityListNav } from '@/components/community/community-list-nav';
import { useCommunityListContext } from '@/components/community/community-list-context';
import { CreateCommunityCta } from '@/components/community/create-community-cta';
import { PageHeader } from '@/components/app/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { PageBody } from '@/components/shared/page-body';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

export const COMMUNITY_LIST_GRID_CLASS = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3';

interface CommunityListShellProps {
  children: ReactNode;
}

export function CommunityListShell({ children }: CommunityListShellProps) {
  const router = useRouter();
  const { memberCommunities, discoverCommunities, pendingCount, isLoading, error, refetchAll } =
    useCommunityListContext();

  return (
    <PageBody>
      <PageHeader
        title="Communities"
        description="Create groups, join public communities, or accept invitations."
        eyebrow="Groups"
        actions={
          <CreateCommunityCta
            onCreated={(community) => router.push(`/community/${community.id}`)}
          />
        }
      />

      {error ? (
        <ErrorState onRetry={refetchAll} />
      ) : (
        <div className="flex flex-col gap-4">
          {!isLoading ? (
            <CommunityListNav
              memberCount={memberCommunities.length}
              discoverCount={discoverCommunities.length}
              pendingCount={pendingCount}
            />
          ) : null}
          {children}
        </div>
      )}
    </PageBody>
  );
}
