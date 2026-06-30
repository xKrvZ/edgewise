'use client';

import { useBreadcrumbDynamicLabel } from '@/components/app/breadcrumb-context';
import { CommunityDetailProvider } from '@/components/community/community-detail-context';
import { DetailBackLink } from '@/components/shared/detail-back-link';
import { ErrorState } from '@/components/shared/error-state';
import { PageBody } from '@/components/shared/page-body';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import { useParams } from 'next/navigation';

export default function CommunityDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const communityQuery = useQuery(() => api.communities.get(id), [id]);
  const community = communityQuery.data;

  useBreadcrumbDynamicLabel(`community:${id}`, community?.name);

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
        <Skeleton className="min-h-48 w-full rounded-2xl sm:min-h-52" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </PageBody>
    );
  }

  return (
    <CommunityDetailProvider
      community={community}
      refreshCommunity={() => communityQuery.refetch()}
    >
      {children}
    </CommunityDetailProvider>
  );
}
