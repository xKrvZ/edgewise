'use client';

import { useCommunityDetail } from '@/components/community/community-detail-context';
import { CommunityMemberGate } from '@/components/community/community-member-gate';
import { CommunityLeaderboardTable } from '@/components/community/community-leaderboard';
import { getLeaderboardVisibility } from '@/components/community/community-leaderboard.util';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ListSection } from '@/components/shared/list-section';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import type { CommunityMemberRole } from '@/lib/types';
import { Trophy } from 'lucide-react';

const MENTOR_ROLES: CommunityMemberRole[] = ['owner', 'mentor'];

export default function CommunityLeaderboardPage() {
  const { community } = useCommunityDetail();
  const visibility = getLeaderboardVisibility(community);
  const isMember = community.myRole !== null;
  const isMentorOrOwner =
    community.myRole !== null && MENTOR_ROLES.includes(community.myRole);

  const canFetch =
    visibility === 'public' ||
    (visibility === 'members' && isMember) ||
    (visibility === 'mentors' && isMentorOrOwner);

  const leaderboardQuery = useQuery(
    () => api.communities.leaderboard(community.id),
    [community.id],
    { enabled: canFetch },
  );

  if (!isMember && visibility !== 'public') {
    return <CommunityMemberGate feature="leaderboard" />;
  }

  if (visibility === 'mentors' && !isMentorOrOwner) {
    return (
      <EmptyState
        icon={Trophy}
        title="Leaderboard for mentors"
        message="Performance rankings are visible to community owners and mentors. Switch to the Members tab to browse the community roster."
      />
    );
  }

  return (
    <ListSection title="Leaderboard" countLabel="Last 30 days">
      {leaderboardQuery.isLoading ? (
        <>
          <div className="space-y-3 md:hidden">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
          <Skeleton className="hidden h-48 w-full rounded-lg md:block" />
        </>
      ) : leaderboardQuery.error ? (
        <ErrorState onRetry={leaderboardQuery.refetch} />
      ) : leaderboardQuery.data ? (
        <CommunityLeaderboardTable leaderboard={leaderboardQuery.data} />
      ) : null}
    </ListSection>
  );
}
