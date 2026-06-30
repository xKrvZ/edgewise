'use client';

import { DetailBackLink } from '@/components/shared/detail-back-link';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ListSection } from '@/components/shared/list-section';
import { PageBody } from '@/components/shared/page-body';
import { UserAvatar } from '@/components/shared/user-avatar';
import { TradesTable } from '@/components/trades/trades-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTableContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import type { CommunityMemberRole } from '@/lib/types';
import { BarChart3 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

const MENTOR_ROLES: CommunityMemberRole[] = ['owner', 'mentor'];

export default function CommunityMemberTradesPage() {
  const params = useParams<{ id: string; userId: string }>();
  const { id: communityId, userId: memberUserId } = params;
  const router = useRouter();
  const [cursor, setCursor] = useState<string | undefined>();

  const communityQuery = useQuery(() => api.communities.get(communityId), [communityId]);
  const community = communityQuery.data;
  const isMentorView =
    community?.myRole !== null &&
    community?.myRole !== undefined &&
    MENTOR_ROLES.includes(community.myRole);

  const member = useMemo(
    () => community?.members?.find((m) => m.userId === memberUserId),
    [community, memberUserId],
  );

  const tradesQuery = useQuery(
    () => api.communities.memberTrades(communityId, memberUserId, { cursor, limit: 25 }),
    [communityId, memberUserId, cursor],
    { enabled: isMentorView },
  );

  const trades = tradesQuery.data?.items ?? [];
  const hasPreviousPage = Boolean(tradesQuery.data?.previousCursor);
  const hasNextPage = Boolean(tradesQuery.data?.nextCursor);

  if (communityQuery.error) {
    return (
      <PageBody>
        <DetailBackLink href={`/community/${communityId}`} label="Community" />
        <ErrorState title="Community not found" onRetry={communityQuery.refetch} />
      </PageBody>
    );
  }

  if (communityQuery.isLoading || !community) {
    return (
      <PageBody>
        <DetailBackLink href={`/community/${communityId}`} label="Community" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </PageBody>
    );
  }

  if (!isMentorView) {
    return (
      <PageBody>
        <DetailBackLink href={`/community/${communityId}`} label="Community" />
        <ErrorState
          title="Access denied"
          message="Only community owners and mentors can view member trades."
        />
      </PageBody>
    );
  }

  if (!member) {
    return (
      <PageBody>
        <DetailBackLink href={`/community/${communityId}`} label="Community" />
        <ErrorState
          title="Member not found"
          message="This user is not a member of this community."
        />
      </PageBody>
    );
  }

  return (
    <PageBody>
      <DetailBackLink href={`/community/${communityId}`} label={community.name} />

      <div className="flex items-center gap-3 border-b border-border/60 pb-6">
        <UserAvatar
          name={member.displayName}
          avatarUrl={member.avatarUrl}
          className="h-12 w-12 shrink-0"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {member.displayName}
            </h1>
            <Badge variant="outline" className="capitalize">
              {member.role}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Trades in {community.name}
          </p>
        </div>
      </div>

      <ListSection
        title="Trades"
        countLabel={
          tradesQuery.data
            ? `${trades.length} on this page`
            : tradesQuery.isLoading
              ? undefined
              : '0 total'
        }
      >
        {tradesQuery.error ? (
          <ErrorState onRetry={tradesQuery.refetch} />
        ) : tradesQuery.isLoading && trades.length === 0 ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : trades.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No trades yet"
            message="This member has not logged any trades."
          />
        ) : (
          <Card>
            <CardTableContent>
              <TradesTable
                trades={trades}
                compact
                onRowClick={(trade) =>
                  router.push(
                    `/trades/${trade.id}?comments=1&communityId=${communityId}`,
                  )
                }
              />
            </CardTableContent>
          </Card>
        )}

        {(hasPreviousPage || hasNextPage) && (
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPreviousPage}
              onClick={() => setCursor(tradesQuery.data?.previousCursor ?? undefined)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNextPage}
              onClick={() => setCursor(tradesQuery.data?.nextCursor ?? undefined)}
            >
              Next
            </Button>
          </div>
        )}
      </ListSection>
    </PageBody>
  );
}
