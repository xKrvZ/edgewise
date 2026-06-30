'use client';

import { CommunityCard, CommunityCardSkeleton } from '@/components/community/community-card';
import { COMMUNITY_LIST_GRID_CLASS } from '@/components/community/community-list-shell';
import { useCommunityListContext } from '@/components/community/community-list-context';
import { EmptyState } from '@/components/shared/empty-state';
import { Compass } from 'lucide-react';

export default function DiscoverCommunitiesPage() {
  const { discoverCommunities, isLoading, refetchAll } = useCommunityListContext();

  if (isLoading) {
    return (
      <div className={COMMUNITY_LIST_GRID_CLASS}>
        {(['a', 'b', 'c'] as const).map((key) => (
          <CommunityCardSkeleton key={key} />
        ))}
      </div>
    );
  }

  if (discoverCommunities.length === 0) {
    return (
      <EmptyState
        icon={Compass}
        title="Nothing to discover"
        message="You're already in every available community, or none are open to join right now."
      />
    );
  }

  return (
    <div className={COMMUNITY_LIST_GRID_CLASS}>
      {discoverCommunities.map((community) => (
        <CommunityCard key={community.id} community={community} onJoined={refetchAll} />
      ))}
    </div>
  );
}
