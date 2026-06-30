'use client';

import { CommunityPostCompactCard } from '@/components/community/community-post-compact-card';
import { ApiError, api } from '@/lib/api-client';
import { useSession } from '@/lib/auth-client';
import { useQuery } from '@/lib/hooks/use-query';
import { fetchPublicCommunityPosts } from '@/lib/public-api';
import type { CommunityPostSummary, CommunityPostsQuery } from '@/lib/types';
import { cn } from '@/lib/utils';

const RELATED_POSTS_LIMIT = 8;

export type CommunityPostLinkMode = 'community' | 'share';

interface CommunityPostRelatedCarouselProps {
  communityId: string;
  currentPostId: string;
  /** When true, fetches all posts (public + private). When false, public posts only. */
  isMember?: boolean;
  /** Where compact cards link: in-app community routes or public share routes. */
  linkMode?: CommunityPostLinkMode;
  className?: string;
}

function buildPostHref(
  communityId: string,
  post: CommunityPostSummary,
  linkMode: CommunityPostLinkMode,
): string {
  if (linkMode === 'share' && post.visibility === 'public') {
    return `/share/community/${communityId}/posts/${post.id}`;
  }
  return `/community/${communityId}/posts/${post.id}`;
}

async function fetchRelatedPosts(
  communityId: string,
  currentPostId: string,
  isMember: boolean | undefined,
  isAuthenticated: boolean,
): Promise<CommunityPostSummary[]> {
  const query: CommunityPostsQuery = {
    exclude: currentPostId,
    limit: RELATED_POSTS_LIMIT,
  };

  if (isMember) {
    return api.communities.listPosts(communityId, query);
  }

  if (isAuthenticated) {
    try {
      return await api.communities.listPosts(communityId, query);
    } catch (error) {
      if (!(error instanceof ApiError) || (error.status !== 403 && error.status !== 404)) {
        throw error;
      }
    }
  }

  return fetchPublicCommunityPosts(communityId, query);
}

export function CommunityPostRelatedCarousel({
  communityId,
  currentPostId,
  isMember,
  linkMode = 'community',
  className,
}: CommunityPostRelatedCarouselProps) {
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user?.id);

  const postsQuery = useQuery(
    () => fetchRelatedPosts(communityId, currentPostId, isMember, isAuthenticated),
    [communityId, currentPostId, isMember, isAuthenticated],
  );

  const posts = postsQuery.data ?? [];

  if (postsQuery.isLoading || posts.length === 0) {
    return null;
  }

  return (
    <section className={cn('mx-auto w-full max-w-3xl', className)} aria-label="Related posts">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        Other posts by this community
      </h2>

      <div
        className={cn(
          'mt-4 flex gap-4 overflow-x-auto pb-2',
          'snap-x snap-mandatory scroll-px-4',
          '[-ms-overflow-style:none] scrollbar-thin',
          '[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent',
        )}
      >
        {posts.map((post) => (
          <CommunityPostCompactCard
            key={post.id}
            post={post}
            href={buildPostHref(communityId, post, linkMode)}
          />
        ))}
      </div>
    </section>
  );
}
