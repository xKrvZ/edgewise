'use client';

import { UserAvatar } from '@/components/shared/user-avatar';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { FileX2 } from 'lucide-react';
import type { ReactNode } from 'react';

export interface CommunityPostDeletedStateProps {
  title?: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string | null;
  deletedAt: string;
  eyebrow?: ReactNode;
  className?: string;
}

export function CommunityPostDeletedState({
  title,
  authorDisplayName,
  authorAvatarUrl,
  deletedAt,
  eyebrow,
  className,
}: CommunityPostDeletedStateProps) {
  return (
    <article className={cn('community-post-deleted', className)}>
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 sm:px-8 sm:py-12">
          {eyebrow ? (
            <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-primary">
              {eyebrow}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileX2 className="h-7 w-7" aria-hidden="true" />
            </div>

            <h1 className="mt-5 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              This article has been deleted
            </h1>

            {title ? (
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                &ldquo;{title}&rdquo; is no longer available.
              </p>
            ) : null}

            <p className="mt-2 text-sm text-muted-foreground">
              Deleted {formatDateTime(deletedAt)}
            </p>

            {authorDisplayName ? (
              <div className="mt-6 flex items-center gap-2.5 text-sm text-muted-foreground">
                <UserAvatar
                  name={authorDisplayName}
                  avatarUrl={authorAvatarUrl ?? null}
                  className="h-8 w-8"
                />
                <span>
                  Originally by <span className="font-medium text-foreground">{authorDisplayName}</span>
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
