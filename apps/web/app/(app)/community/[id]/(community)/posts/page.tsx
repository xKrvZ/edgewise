'use client';

import { useCommunityDetail } from '@/components/community/community-detail-context';
import { CommunityMemberGate } from '@/components/community/community-member-gate';
import { CommunityPostList } from '@/components/community/community-post-list';
import { ErrorState } from '@/components/shared/error-state';
import { ListSection } from '@/components/shared/list-section';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';

export default function CommunityPostsPage() {
  const { community } = useCommunityDetail();

  const postsQuery = useQuery(() => api.communities.listPosts(community.id), [community.id]);
  const posts = postsQuery.data ?? [];

  return (
    <CommunityMemberGate>
      <ListSection title="Posts" countLabel={posts.length > 0 ? `${posts.length} total` : undefined}>
      {postsQuery.error ? (
        <ErrorState title="Failed to load posts" onRetry={postsQuery.refetch} />
      ) : postsQuery.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
          <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
          <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
        </div>
      ) : (
        <CommunityPostList
          communityId={community.id}
          posts={posts}
          myRole={community.myRole!}
        />
      )}
      </ListSection>
    </CommunityMemberGate>
  );
}
