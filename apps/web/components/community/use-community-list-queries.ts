'use client';

import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import { useMemo } from 'react';

export function useCommunityListQueries() {
  const communitiesQuery = useQuery(() => api.communities.list(), []);
  const invitationsQuery = useQuery(() => api.invitations.listMine(), []);

  const communities = communitiesQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];

  const memberCommunities = useMemo(
    () =>
      communities
        .filter((c) => c.myRole !== null)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [communities],
  );

  const discoverCommunities = useMemo(
    () =>
      communities
        .filter((c) => c.myRole === null)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [communities],
  );

  function refetchAll() {
    communitiesQuery.refetch();
    invitationsQuery.refetch();
  }

  return {
    communitiesQuery,
    invitationsQuery,
    communities,
    invitations,
    memberCommunities,
    discoverCommunities,
    pendingCount: invitations.length,
    isLoading: communitiesQuery.isLoading || invitationsQuery.isLoading,
    error: communitiesQuery.error ?? invitationsQuery.error,
    refetchAll,
  };
}
