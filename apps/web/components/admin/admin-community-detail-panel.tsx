'use client';

import { AccountSettingsRow } from '@/components/account/account-settings-row';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTableContent,
  CardTableFooter,
  CardTitle,
  cardTableStatePaddingClass,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiError, api } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import type { AdminCommunityPostRow, AdminCommunityRow } from '@/lib/types/admin';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, EyeOff, FileText, RotateCcw, Star, Trash2, User, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const POST_PAGE_SIZE = 25;

interface AdminCommunityDetailPanelProps {
  communityId: string;
}

type PostAction =
  | 'soft-delete'
  | 'restore'
  | 'hide-discover'
  | 'show-discover';

export function AdminCommunityDetailPanel({ communityId }: AdminCommunityDetailPanelProps) {
  const [community, setCommunity] = useState<AdminCommunityRow | null>(null);
  const [posts, setPosts] = useState<AdminCommunityPostRow[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsOffset, setPostsOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [discoverDialogOpen, setDiscoverDialogOpen] = useState(false);
  const [featuredDialogOpen, setFeaturedDialogOpen] = useState(false);
  const [postAction, setPostAction] = useState<{ post: AdminCommunityPostRow; action: PostAction } | null>(null);

  const loadCommunity = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const detail = await api.admin.communities.get(communityId);
      setCommunity(detail);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load community');
      setCommunity(null);
    } finally {
      setIsLoading(false);
    }
  }, [communityId]);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    setPostsError(null);
    try {
      const page = await api.admin.communities.posts(communityId, {
        limit: POST_PAGE_SIZE,
        offset: postsOffset,
        includeDeleted: true,
      });
      setPosts(page.items);
      setPostsTotal(page.total);
    } catch (err) {
      setPostsError(err instanceof ApiError ? err.message : 'Failed to load posts');
      setPosts([]);
      setPostsTotal(0);
    } finally {
      setPostsLoading(false);
    }
  }, [communityId, postsOffset]);

  useEffect(() => {
    void loadCommunity();
  }, [loadCommunity]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  async function toggleDiscoverVisibility() {
    if (!community) return;
    try {
      const updated = community.discoverHiddenAt
        ? await api.admin.communities.showOnDiscover(communityId)
        : await api.admin.communities.hideFromDiscover(communityId);
      setCommunity(updated);
      toast.success(
        updated.discoverHiddenAt
          ? 'Community hidden from discover'
          : 'Community visible on discover',
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action failed');
      throw err;
    }
  }

  async function toggleFeatured() {
    if (!community) return;
    try {
      const updated = community.featured
        ? await api.admin.communities.unfeature(communityId)
        : await api.admin.communities.feature(communityId);
      setCommunity(updated);
      toast.success(updated.featured ? 'Community featured' : 'Community unfeatured');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action failed');
      throw err;
    }
  }

  async function runPostAction() {
    if (!postAction) return;
    const { post, action } = postAction;

    try {
      let updated: AdminCommunityPostRow;
      switch (action) {
        case 'soft-delete':
          updated = await api.admin.communities.softDeletePost(communityId, post.id);
          toast.success('Post soft deleted');
          break;
        case 'restore':
          updated = await api.admin.communities.restorePost(communityId, post.id);
          toast.success('Post restored');
          break;
        case 'hide-discover':
          updated = await api.admin.communities.hidePostFromDiscover(communityId, post.id);
          toast.success('Post hidden from public listings');
          break;
        case 'show-discover':
          updated = await api.admin.communities.showPostOnDiscover(communityId, post.id);
          toast.success('Post visible on public listings');
          break;
      }

      setPosts((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      void loadCommunity();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action failed');
      throw err;
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <EmptyState
        icon={FileText}
        title="Could not load community"
        message={error ?? 'Community not found'}
      />
    );
  }

  const postsPage = Math.floor(postsOffset / POST_PAGE_SIZE) + 1;
  const postsPageCount = Math.max(1, Math.ceil(postsTotal / POST_PAGE_SIZE));
  const canPostsPrev = postsOffset > 0;
  const canPostsNext = postsOffset + POST_PAGE_SIZE < postsTotal;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-2">
          <h2 className="truncate text-2xl font-semibold tracking-tight text-foreground">
            {community.name}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {community.featured ? (
              <Badge variant="success">
                <Star className="h-3 w-3 fill-current" />
                Featured
              </Badge>
            ) : (
              <Badge variant="secondary">Not featured</Badge>
            )}
            {community.discoverHiddenAt ? (
              <Badge variant="secondary">
                Hidden from discover since {formatDate(community.discoverHiddenAt)}
              </Badge>
            ) : (
              <Badge variant="success">Visible on discover</Badge>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={community.featured ? 'default' : 'outline'}
            onClick={() => setFeaturedDialogOpen(true)}
          >
            <Star className={cn('h-4 w-4', community.featured && 'fill-current')} />
            {community.featured ? 'Unfeature' : 'Feature community'}
          </Button>
          <Button
            type="button"
            variant={community.discoverHiddenAt ? 'default' : 'outline'}
            onClick={() => setDiscoverDialogOpen(true)}
          >
            <EyeOff className="h-4 w-4" />
            {community.discoverHiddenAt ? 'Show on discover' : 'Hide from discover'}
          </Button>
        </div>
      </div>

      <Card className="gap-0 overflow-hidden">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-base font-semibold">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          <AccountSettingsRow icon={User} label="Creator" value={community.creatorEmail} />
          <AccountSettingsRow icon={Users} label="Members" value={String(community.memberCount)} />
          <AccountSettingsRow icon={FileText} label="Posts" value={String(community.postCount)} />
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-base font-semibold">Posts</CardTitle>
        </CardHeader>
        <CardTableContent>
          {postsLoading ? (
            <div className={cn(cardTableStatePaddingClass, 'space-y-2')}>
              {Array.from({ length: 4 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : postsError ? (
            <div className={cardTableStatePaddingClass}>
              <EmptyState
                variant="embedded"
                icon={FileText}
                title="Could not load posts"
                message={postsError}
              />
            </div>
          ) : posts.length === 0 ? (
            <div className={cardTableStatePaddingClass}>
              <EmptyState
                variant="embedded"
                icon={FileText}
                title="No posts"
                message="This community has no posts yet."
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-[14rem] truncate font-medium">{post.title}</TableCell>
                      <TableCell className="text-muted-foreground">{post.authorEmail}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{post.visibility}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {post.deletedAt ? (
                            <Badge variant="destructive">Deleted</Badge>
                          ) : (
                            <Badge variant="success">Active</Badge>
                          )}
                          {post.discoverHiddenAt ? (
                            <Badge variant="secondary">Hidden</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(post.publishedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {post.deletedAt ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setPostAction({ post, action: 'restore' })
                              }
                            >
                              <RotateCcw className="h-4 w-4" />
                              Restore
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setPostAction({ post, action: 'soft-delete' })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          )}
                          {post.discoverHiddenAt ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setPostAction({ post, action: 'show-discover' })
                              }
                            >
                              Show
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setPostAction({ post, action: 'hide-discover' })
                              }
                            >
                              <EyeOff className="h-4 w-4" />
                              Hide
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <CardTableFooter>
                <p className="text-sm text-muted-foreground">
                  {postsTotal} post{postsTotal === 1 ? '' : 's'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canPostsPrev || postsLoading}
                    onClick={() => setPostsOffset((current) => Math.max(0, current - POST_PAGE_SIZE))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="min-w-[7.5rem] text-center text-sm tabular-nums text-muted-foreground">
                    Page {postsPage} of {postsPageCount}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canPostsNext || postsLoading}
                    onClick={() => setPostsOffset((current) => current + POST_PAGE_SIZE)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTableFooter>
            </>
          )}
        </CardTableContent>
      </Card>

      <ConfirmDialog
        open={featuredDialogOpen}
        onOpenChange={setFeaturedDialogOpen}
        title={community.featured ? 'Unfeature this community?' : 'Feature this community?'}
        description={
          community.featured
            ? 'This community will no longer be highlighted on discover.'
            : 'This community will be highlighted on discover for users browsing communities.'
        }
        confirmLabel={community.featured ? 'Unfeature' : 'Feature community'}
        onConfirm={toggleFeatured}
      />

      <ConfirmDialog
        open={discoverDialogOpen}
        onOpenChange={setDiscoverDialogOpen}
        title={
          community.discoverHiddenAt ? 'Show community on discover?' : 'Hide community from discover?'
        }
        description={
          community.discoverHiddenAt
            ? 'Non-members will see this community on the discover page again.'
            : 'Non-members will no longer see this community on the discover page. Members are unaffected.'
        }
        confirmLabel={community.discoverHiddenAt ? 'Show on discover' : 'Hide from discover'}
        destructive={!community.discoverHiddenAt}
        onConfirm={toggleDiscoverVisibility}
      />

      <ConfirmDialog
        open={postAction !== null}
        onOpenChange={(open) => {
          if (!open) setPostAction(null);
        }}
        title={
          postAction?.action === 'soft-delete'
            ? 'Soft delete this post?'
            : postAction?.action === 'restore'
              ? 'Restore this post?'
              : postAction?.action === 'hide-discover'
                ? 'Hide post from public listings?'
                : 'Show post on public listings?'
        }
        description={
          postAction?.action === 'soft-delete'
            ? 'The post will be removed from lists but remain as a tombstone for members.'
            : postAction?.action === 'restore'
              ? 'The post will appear in community lists again.'
              : postAction?.action === 'hide-discover'
                ? 'Public post listings will exclude this post. Members can still see it.'
                : 'Public post listings will include this post again.'
        }
        confirmLabel={
          postAction?.action === 'soft-delete'
            ? 'Delete post'
            : postAction?.action === 'restore'
              ? 'Restore post'
              : postAction?.action === 'hide-discover'
                ? 'Hide post'
                : 'Show post'
        }
        destructive={postAction?.action === 'soft-delete'}
        onConfirm={runPostAction}
      />
    </div>
  );
}
