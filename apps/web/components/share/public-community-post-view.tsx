import { CommunityPostArticle } from '@/components/community/community-post-article';
import { Badge } from '@/components/ui/badge';
import type { PublicCommunityPostDetail } from '@/lib/types';

interface PublicCommunityPostViewProps {
  post: PublicCommunityPostDetail;
}

export function PublicCommunityPostView({ post }: PublicCommunityPostViewProps) {
  return (
    <CommunityPostArticle
      title={post.title}
      authorDisplayName={post.authorDisplayName}
      authorAvatarUrl={post.authorAvatarUrl}
      publishedAt={post.publishedAt}
      updatedAt={post.updatedAt}
      content={post.content}
      headerUrl={post.headerUrl}
      eyebrow={post.communityName}
      badges={
        !post.commentsEnabled ? (
          <Badge variant="outline" className="text-muted-foreground">
            Comments off
          </Badge>
        ) : undefined
      }
    />
  );
}
