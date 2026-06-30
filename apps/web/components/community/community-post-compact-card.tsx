'use client';

import { UserAvatar } from '@/components/shared/user-avatar';
import { formatDate } from '@/lib/format';
import type { CommunityPostSummary } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';
import Link from 'next/link';

interface CommunityPostCompactCardProps {
  post: CommunityPostSummary;
  href: string;
  className?: string;
}

export function CommunityPostCompactCard({
  post,
  href,
  className,
}: CommunityPostCompactCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md sm:w-72',
        className,
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-muted/40">
        {post.headerUrl ? (
          // biome-ignore lint/performance/noImgElement: presigned S3 URLs are not compatible with next/image
          <img
            src={post.headerUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/30">
            <FileText className="h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}
        {post.visibility === 'public' ? (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-primary shadow-sm backdrop-blur-sm">
            Public
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-5 text-muted-foreground">
          {post.excerpt}
        </p>

        <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3">
          <UserAvatar
            displayName={post.authorDisplayName}
            avatarUrl={post.authorAvatarUrl}
            className="h-6 w-6"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{post.authorDisplayName}</p>
            <p className="text-[0.6875rem] text-muted-foreground">
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
