'use client';

import { CommunityPostDeletedState } from '@/components/community/community-post-deleted-state';
import { CommunityPostComments } from '@/components/community/community-post-comments';
import { CommunityPostRelatedCarousel } from '@/components/community/community-post-related-carousel';
import { PublicCommunityPostView } from '@/components/share/public-community-post-view';
import { useSession } from '@/lib/auth-client';
import type { PublicCommunityPostDetail } from '@/lib/types';

interface PublicCommunityPostPageClientProps {
  post: PublicCommunityPostDetail;
  communityId: string;
}

export function PublicCommunityPostPageClient({
  post,
  communityId,
}: PublicCommunityPostPageClientProps) {
  const { data: session } = useSession();

  return (
    <div className="space-y-8">
      {post.isDeleted ? (
        <CommunityPostDeletedState
          title={post.title}
          authorDisplayName={post.authorDisplayName}
          authorAvatarUrl={post.authorAvatarUrl}
          deletedAt={post.deletedAt ?? post.updatedAt}
          eyebrow={post.communityName}
        />
      ) : (
        <PublicCommunityPostView post={post} />
      )}
      {!post.isDeleted ? (
        <CommunityPostRelatedCarousel
          communityId={communityId}
          currentPostId={post.id}
          isMember={false}
          linkMode="share"
        />
      ) : null}
      <CommunityPostComments
        communityId={communityId}
        post={post}
        isMember={false}
        currentUserId={session?.user?.id}
        usePublicCommentsApi={!session?.user?.id}
      />
    </div>
  );
}
