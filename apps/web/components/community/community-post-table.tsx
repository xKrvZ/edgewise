'use client';

import { wasPostUpdated } from '@/components/community/community-post.util';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import type { CommunityPostSummary } from '@/lib/types';
import { ArrowUpRight, Pencil } from 'lucide-react';
import Link from 'next/link';

interface CommunityPostTableProps {
  communityId: string;
  posts: CommunityPostSummary[];
  currentUserId?: string;
  isCommunityOwner: boolean;
}

function canManagePost(
  post: CommunityPostSummary,
  currentUserId: string | undefined,
  isCommunityOwner: boolean,
): boolean {
  if (!currentUserId) {
    return false;
  }
  return post.authorUserId === currentUserId || isCommunityOwner;
}

export function CommunityPostTable({
  communityId,
  posts,
  currentUserId,
  isCommunityOwner,
}: CommunityPostTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Published</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead>Visibility</TableHead>
          <TableHead className="text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts.map((post) => {
          const showUpdated = wasPostUpdated(post.publishedAt, post.updatedAt);
          const href = `/community/${communityId}/posts/${post.id}`;
          const showEdit = canManagePost(post, currentUserId, isCommunityOwner);
          const editHref = `${href}?edit=1`;

          return (
            <TableRow key={post.id}>
              <TableCell className="max-w-[16rem] whitespace-normal sm:max-w-xs">
                <Link
                  href={href}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {post.title}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <UserAvatar
                    displayName={post.authorDisplayName}
                    avatarUrl={post.authorAvatarUrl}
                    className="h-6 w-6"
                  />
                  <span className="max-w-32 truncate">{post.authorDisplayName}</span>
                </div>
              </TableCell>
              <TableCell>
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              </TableCell>
              <TableCell>
                {showUpdated ? (
                  <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {post.visibility === 'public' ? (
                  <Badge variant="secondary" className="text-[0.65rem]">
                    Public
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[0.65rem]">
                    Members
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={href}>
                      View
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                  {showEdit ? (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={editHref}>
                        Edit
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
