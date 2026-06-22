'use client';

import { CommunityCard } from '@/components/community/community-card';
import { CreateCommunityCta } from '@/components/community/create-community-cta';
import { PendingInvitations } from '@/components/community/pending-invitations';
import { PageHeader } from '@/components/app/page-header';
import { ListSection } from '@/components/shared/list-section';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageBody } from '@/components/shared/page-body';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { canCreateCommunity } from '@/lib/billing-plans';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

export default function CommunityPage() {
  const router = useRouter();
  const { status } = useSubscription();
  const canCreate = canCreateCommunity(status?.planId);

  const communitiesQuery = useQuery(() => api.communities.list(), []);
  const invitationsQuery = useQuery(() => api.invitations.listMine(), []);

  const communities = communitiesQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];
  const pendingCount = invitations.length;

  const isLoading = communitiesQuery.isLoading || invitationsQuery.isLoading;
  const error = communitiesQuery.error ?? invitationsQuery.error;

  const sortedCommunities = useMemo(
    () =>
      [...communities].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [communities],
  );

  function refetchAll() {
    communitiesQuery.refetch();
    invitationsQuery.refetch();
  }

  return (
    <PageBody>
      <PageHeader
        title="Community"
        description="Create groups, invite traders, and track mentorship progress."
        eyebrow="Groups"
        actions={
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge variant="secondary">{pendingCount} pending invite{pendingCount === 1 ? '' : 's'}</Badge>
            )}
            <CreateCommunityCta
              onCreated={(community) => router.push(`/community/${community.id}`)}
            />
          </div>
        }
      />

      {error ? (
        <ErrorState onRetry={refetchAll} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(['a', 'b', 'c'] as const).map((key) => (
            <Skeleton key={key} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <PendingInvitations invitations={invitations} onChanged={refetchAll} />

          {sortedCommunities.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No communities yet"
              message={
                canCreate
                  ? 'Create a community to mentor traders or join one when you receive an invitation.'
                  : 'Join a community when you receive an invitation, or upgrade to Elite to create your own.'
              }
              action={
                <CreateCommunityCta
                  onCreated={(community) => router.push(`/community/${community.id}`)}
                />
              }
            />
          ) : (
            <ListSection title="Your communities" countLabel={`${sortedCommunities.length} total`}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    onOpen={() => router.push(`/community/${community.id}`)}
                  />
                ))}
              </div>
            </ListSection>
          )}
        </>
      )}
    </PageBody>
  );
}
