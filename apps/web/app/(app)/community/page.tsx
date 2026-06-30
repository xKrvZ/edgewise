'use client';

import { CommunityCard, CommunityCardSkeleton } from '@/components/community/community-card';
import { COMMUNITY_LIST_GRID_CLASS } from '@/components/community/community-list-shell';
import { useCommunityListContext } from '@/components/community/community-list-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MyCommunitiesPage() {
  const router = useRouter();
  const { memberCommunities, isLoading, error } = useCommunityListContext();

  useEffect(() => {
    if (!isLoading && !error && memberCommunities.length === 0) {
      router.replace('/community/discover');
    }
  }, [isLoading, error, memberCommunities.length, router]);

  if (isLoading) {
    return (
      <div className={COMMUNITY_LIST_GRID_CLASS}>
        {(['a', 'b', 'c'] as const).map((key) => (
          <CommunityCardSkeleton key={key} />
        ))}
      </div>
    );
  }

  if (error || memberCommunities.length === 0) {
    return null;
  }

  return (
    <div className={COMMUNITY_LIST_GRID_CLASS}>
      {memberCommunities.map((community) => (
        <CommunityCard key={community.id} community={community} />
      ))}
    </div>
  );
}
