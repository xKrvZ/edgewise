'use client';

import { UserAvatar } from '@/components/shared/user-avatar';
import { wasPostUpdated } from '@/components/community/community-post.util';
import { formatDateTime } from '@/lib/format';
import { useHeaderImageContrast } from '@/lib/hooks/use-header-image-contrast';
import {
  resolveHeaderImageStyles,
} from '@/lib/header-image-styles';
import { sanitizePostHtml } from '@/lib/sanitize-html';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

function isLikelyHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

export interface CommunityPostArticleProps {
  title: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  publishedAt: string;
  updatedAt: string;
  content: string;
  headerUrl?: string | null;
  eyebrow?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function CommunityPostArticle({
  title,
  authorDisplayName,
  authorAvatarUrl,
  publishedAt,
  updatedAt,
  content,
  headerUrl,
  eyebrow,
  badges,
  actions,
  className,
}: CommunityPostArticleProps) {
  const sanitizedContent = isLikelyHtml(content) ? sanitizePostHtml(content) : content;
  const showUpdated = wasPostUpdated(publishedAt, updatedAt);

  const { textTheme, analyzed, isLoading } = useHeaderImageContrast(headerUrl ?? null);
  const { hasImage, useLightText, gradientClass } = resolveHeaderImageStyles(
    headerUrl,
    textTheme,
    analyzed,
    isLoading,
  );

  return (
    <article className={cn('community-post-article', className)}>
      <div className="mx-auto w-full max-w-3xl">
        <div
          className={cn(
            'relative flex min-h-52 flex-col justify-end overflow-hidden rounded-2xl px-4 py-6 sm:min-h-60 sm:px-6 sm:py-8',
            hasImage ? 'bg-muted' : 'bg-muted/40',
          )}
        style={
          headerUrl
            ? {
                backgroundImage: `url(${headerUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {gradientClass ? (
          <div
            className={cn('pointer-events-none absolute inset-0 z-[1]', gradientClass)}
            aria-hidden="true"
          />
        ) : null}

        {actions ? (
          <div
            className={cn(
              'absolute right-4 top-4 z-20 flex flex-wrap items-center justify-end gap-2',
              hasImage &&
                useLightText &&
                cn(
                  '[&_button]:border-white/30 [&_button]:bg-white/10 [&_button]:text-white',
                  '[&_button]:hover:bg-white/20 [&_button]:hover:text-white',
                ),
              hasImage &&
                !useLightText &&
                cn(
                  '[&_button]:border-slate-900/20 [&_button]:bg-white/60 [&_button]:text-slate-950',
                  '[&_button]:hover:bg-white/80 [&_button]:hover:text-slate-950',
                ),
            )}
          >
            {actions}
          </div>
        ) : null}

        <header className="relative z-10 w-full space-y-4">
          {eyebrow ? (
            <p
              className={cn(
                'text-[0.6875rem] font-semibold uppercase tracking-widest',
                hasImage
                  ? useLightText
                    ? 'text-white/80'
                    : 'text-primary'
                  : 'text-primary',
              )}
            >
              {eyebrow}
            </p>
          ) : null}

          <div className="space-y-3">
            <h1
              className={cn(
                'text-balance text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl',
                hasImage && (useLightText ? 'text-white' : 'text-slate-950'),
                !hasImage && 'text-foreground',
              )}
            >
              {title}
            </h1>
            {badges ? (
              <div
                className={cn(
                  'flex flex-wrap items-center gap-2',
                  hasImage &&
                    useLightText &&
                    '[&_[data-slot=badge]]:border-white/25 [&_[data-slot=badge]]:bg-white/15 [&_[data-slot=badge]]:text-white [&_[data-slot=badge]]:hover:bg-white/15',
                  hasImage &&
                    !useLightText &&
                    '[&_[data-slot=badge]]:text-slate-950',
                )}
              >
                {badges}
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              'flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm',
              hasImage
                ? useLightText
                  ? 'text-white/75'
                  : 'text-slate-600'
                : 'text-muted-foreground',
            )}
          >
            <div className="flex items-center gap-2.5">
              <UserAvatar
                name={authorDisplayName}
                avatarUrl={authorAvatarUrl}
                className="h-9 w-9 ring-2 ring-background/80"
              />
              <span
                className={cn(
                  'font-medium',
                  hasImage
                    ? useLightText
                      ? 'text-white'
                      : 'text-slate-950'
                    : 'text-foreground',
                )}
              >
                {authorDisplayName}
              </span>
            </div>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <time dateTime={publishedAt}>Published {formatDateTime(publishedAt)}</time>
            {showUpdated ? (
              <>
                <span aria-hidden="true">·</span>
                <time dateTime={updatedAt}>Updated {formatDateTime(updatedAt)}</time>
              </>
            ) : null}
          </div>
        </header>
        </div>

        <div className="py-8">
          {isLikelyHtml(content) ? (
            <div
              className="community-post-body"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via DOMPurify
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
              {content}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
