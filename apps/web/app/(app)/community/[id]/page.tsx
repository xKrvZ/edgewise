'use client';

import { CommunityLeaderboardTable } from '@/components/community/community-leaderboard';
import { CommunityStatsBar } from '@/components/community/community-stats-bar';
import { InviteMemberDialog } from '@/components/community/invite-member-dialog';
import { DetailBackLink } from '@/components/shared/detail-back-link';
import { UserAvatar } from '@/components/shared/user-avatar';
import { ErrorState } from '@/components/shared/error-state';
import { ListSection } from '@/components/shared/list-section';
import { PageBody } from '@/components/shared/page-body';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import type { CommunityMemberRole } from '@/lib/types';
import { UserPlus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

const MENTOR_ROLES: CommunityMemberRole[] = ['owner', 'mentor'];

export default function CommunityDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [inviteOpen, setInviteOpen] = useState(false);

  const communityQuery = useQuery(() => api.communities.get(id), [id]);
  const community = communityQuery.data;

  const isMentorView = community ? MENTOR_ROLES.includes(community.myRole) : false;

  const statsQuery = useQuery(() => api.communities.stats(id), [id], {
    enabled: isMentorView,
  });
  const leaderboardQuery = useQuery(() => api.communities.leaderboard(id), [id], {
    enabled: isMentorView,
  });

  const members = useMemo(() => community?.members ?? [], [community]);

  if (communityQuery.error) {
    return (
      <PageBody>
        <DetailBackLink href="/community" label="Communities" />
        <ErrorState title="Community not found" onRetry={communityQuery.refetch} />
      </PageBody>
    );
  }

  if (communityQuery.isLoading || !community) {
    return (
      <PageBody>
        <DetailBackLink href="/community" label="Communities" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </PageBody>
    );
  }

  return (
    <PageBody>
      <DetailBackLink href="/community" label="Communities" />

      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{community.name}</h1>
            <Badge variant="secondary" className="capitalize">
              {community.myRole}
            </Badge>
          </div>
          {community.description ? (
            <p className="max-w-2xl text-muted-foreground">{community.description}</p>
          ) : (
            <p className="text-muted-foreground italic">No description</p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {community.memberCount} member{community.memberCount === 1 ? '' : 's'}
          </p>
        </div>

        {isMentorView && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite member
          </Button>
        )}
      </div>

      {isMentorView && statsQuery.data && <CommunityStatsBar stats={statsQuery.data} />}

      {isMentorView && (
        <ListSection title="Leaderboard" countLabel="Last 30 days">
          {leaderboardQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : leaderboardQuery.error ? (
            <ErrorState onRetry={leaderboardQuery.refetch} />
          ) : leaderboardQuery.data ? (
            <CommunityLeaderboardTable leaderboard={leaderboardQuery.data} />
          ) : null}
        </ListSection>
      )}

      <ListSection title="Members" countLabel={`${members.length} total`}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Member list</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2.5 transition-colors duration-150 hover:bg-muted/50"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <UserAvatar
                    name={member.displayName}
                    avatarUrl={member.avatarUrl}
                    className="h-8 w-8 shrink-0"
                  />
                  <span className="truncate font-medium">{member.displayName}</span>
                </div>
                <Badge variant="outline" className="capitalize">
                  {member.role}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </ListSection>

      <InviteMemberDialog
        communityId={id}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={() => {
          communityQuery.refetch();
          statsQuery.refetch();
          leaderboardQuery.refetch();
        }}
      />
    </PageBody>
  );
}
