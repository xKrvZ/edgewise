'use client';

import { useCommunityDetail } from '@/components/community/community-detail-context';
import { CommunityPostArticle } from '@/components/community/community-post-article';
import { CommunityPostComments } from '@/components/community/community-post-comments';
import { CommunityPostDeletedState } from '@/components/community/community-post-deleted-state';
import { CommunityPostRelatedCarousel } from '@/components/community/community-post-related-carousel';
import { CommunityPostForm } from '@/components/community/community-post-form';
import { useBreadcrumbDynamicLabel } from '@/components/app/breadcrumb-context';
import { DetailBackLink } from '@/components/shared/detail-back-link';
import { ErrorState } from '@/components/shared/error-state';
import { PageBody } from '@/components/shared/page-body';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, api } from '@/lib/api-client';
import { useSession } from '@/lib/auth-client';
import { useQuery } from '@/lib/hooks/use-query';
import { Loader2, Link2, Pencil, Trash2 } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function CommunityPostDetailPage() {
  const params = useParams<{ id: string; postId: string }>();
  const { id: communityId, postId } = params;
  const { community } = useCommunityDetail();
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const postQuery = useQuery(
    () => api.communities.getPost(communityId, postId),
    [communityId, postId],
  );
  const post = postQuery.data;

  useBreadcrumbDynamicLabel(
    `posts:${postId}`,
    post?.isDeleted ? 'Deleted article' : post?.title,
  );

  const canManage = useMemo(() => {
    if (!post || post.isDeleted || !session?.user?.id) {
      return false;
    }
    return post.authorUserId === session.user.id || community.myRole === 'owner';
  }, [post, session?.user?.id, community.myRole]);

  useEffect(() => {
    if (canManage && searchParams.get('edit') === '1') {
      setEditing(true);
    }
  }, [canManage, searchParams]);

  async function handleCopyShareLink() {
    const url = `${window.location.origin}/share/community/${communityId}/posts/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied');
    } catch {
      toast.error('Could not copy link');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.communities.removePost(communityId, postId);
      toast.success('Post deleted');
      router.push(`/community/${communityId}/posts`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete post';
      toast.error(message);
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (postQuery.error) {
    return (
      <PageBody>
        <DetailBackLink href={`/community/${communityId}/posts`} label="Posts" />
        <ErrorState title="Post not found" onRetry={postQuery.refetch} />
      </PageBody>
    );
  }

  if (postQuery.isLoading || !post) {
    return (
      <PageBody>
        <DetailBackLink href={`/community/${communityId}/posts`} label="Posts" />
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <Skeleton className="min-h-52 w-full rounded-2xl sm:min-h-60" />
          <Skeleton className="h-40 w-full" />
        </div>
      </PageBody>
    );
  }

  const manageActions = canManage && !editing ? (
    <>
      {post.visibility === 'public' ? (
        <Button type="button" variant="outline" size="sm" onClick={handleCopyShareLink}>
          <Link2 className="mr-2 h-4 w-4" />
          Copy share link
        </Button>
      ) : null}
      <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
    </>
  ) : undefined;

  const postBadges =
    post.visibility === 'public' || !post.commentsEnabled ? (
      <>
        {post.visibility === 'public' ? <Badge variant="secondary">Public</Badge> : null}
        {!post.commentsEnabled ? (
          <Badge variant="outline" className="text-muted-foreground">
            Comments off
          </Badge>
        ) : null}
      </>
    ) : undefined;

  return (
    <PageBody className="space-y-10">
      <DetailBackLink href={`/community/${communityId}/posts`} label="Posts" />

      {editing ? (
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-lg font-semibold text-foreground">Edit post</h1>
          <CommunityPostForm
            communityId={communityId}
            post={post}
            onSaved={(saved) => {
              postQuery.refetch();
              setEditing(false);
              router.replace(`/community/${communityId}/posts/${saved.id}`);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : post.isDeleted ? (
        <CommunityPostDeletedState
          title={post.title}
          authorDisplayName={post.authorDisplayName}
          authorAvatarUrl={post.authorAvatarUrl}
          deletedAt={post.deletedAt ?? post.updatedAt}
        />
      ) : (
        <CommunityPostArticle
          title={post.title}
          authorDisplayName={post.authorDisplayName}
          authorAvatarUrl={post.authorAvatarUrl}
          publishedAt={post.publishedAt}
          updatedAt={post.updatedAt}
          content={post.content}
          headerUrl={post.headerUrl}
          badges={postBadges}
          actions={manageActions}
        />
      )}

      {!editing ? (
        <>
          <CommunityPostRelatedCarousel
            communityId={communityId}
            currentPostId={postId}
            isMember
          />
          <CommunityPostComments
            communityId={communityId}
            post={post}
            isMember
            currentUserId={session?.user?.id}
            isCommunityOwner={community.myRole === 'owner'}
          />
        </>
      ) : null}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete post?</DialogTitle>
            <DialogDescription>
              This will remove &ldquo;{post.title}&rdquo; from the community. Anyone with the link
              will see that the article was deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageBody>
  );
}
