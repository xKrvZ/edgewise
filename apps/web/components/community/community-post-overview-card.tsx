'use client';

import { wasPostUpdated } from '@/components/community/community-post.util';
import { UserAvatar } from '@/components/shared/user-avatar';
import { formatDate } from '@/lib/format';
import type { CommunityPostSummary } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';

interface CommunityPostOverviewCardProps {
  communityId: string;
  post: CommunityPostSummary;
  className?: string;
}

export function CommunityPostOverviewCard({
  communityId,
  post,
  className,
}: CommunityPostOverviewCardProps) {
  const showUpdated = wasPostUpdated(post.publishedAt, post.updatedAt);
  const href = `/community/${communityId}/posts/${post.id}`;

  return (
    <Link
      href={href}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg',
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/40">
        {post.headerUrl ? (
          // biome-ignore lint/performance/noImgElement: presigned S3 URLs are not compatible with next/image
          <img
            src={post.headerUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/30">
            <FileText className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}
        {post.visibility === 'public' ? (
          <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur-sm">
            Public
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>

        <div className="mt-5 space-y-3 border-t border-border/60 pt-4">
          <div className="flex items-center gap-2.5">
            <UserAvatar
              displayName={post.authorDisplayName}
              avatarUrl={post.authorAvatarUrl}
              className="h-7 w-7"
            />
            <span className="truncate text-sm font-medium text-foreground">
              {post.authorDisplayName}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="min-w-0 space-y-0.5">
              <p>
                Published{' '}
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              </p>
              {showUpdated ? (
                <p>
                  Updated <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
                </p>
              ) : null}
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Read more
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
