'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { userInitials } from '@/lib/user-display';
import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export interface PublicShareProfileHeaderProps {
  displayName: string;
  avatarUrl?: string | null;
  headerUrl?: string | null;
  label?: string;
  handle?: string | null;
  profileHref?: string | null;
}

export function PublicShareProfileHeader({
  displayName,
  avatarUrl,
  headerUrl,
  label = 'Trader profile',
  handle,
  profileHref,
}: PublicShareProfileHeaderProps) {
  const avatarInitials = userInitials({ displayName });
  const onBanner = Boolean(headerUrl);

  return (
    <div
      className={cn(
        'relative flex min-h-32 flex-col items-start justify-center gap-4 overflow-hidden rounded-2xl px-4 py-5 sm:min-h-36 sm:flex-row sm:items-center sm:justify-between sm:px-6',
        headerUrl ? 'bg-slate-200' : 'bg-slate-100',
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
      {headerUrl ? (
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-r from-slate-950/50 via-slate-950/25 to-transparent"
          aria-hidden="true"
        />
      ) : null}

      <div className="relative flex min-w-0 flex-1 items-center gap-4">
        <Avatar className="h-20 w-20 shrink-0 bg-primary text-primary-foreground shadow-md ring-4 ring-white sm:h-24 sm:w-24">
          <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground sm:text-xl">
            {avatarInitials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 space-y-1">
          <p
            className={cn(
              'text-[0.6875rem] font-bold tracking-widest uppercase',
              onBanner ? 'text-white/80' : 'text-primary',
            )}
          >
            {label}
          </p>
          <h1
            className={cn(
              'truncate text-xl font-bold tracking-tight sm:text-2xl',
              onBanner ? 'text-white' : 'text-slate-950',
            )}
          >
            {displayName}
          </h1>
          {handle ? (
            <p
              className={cn(
                'truncate text-sm',
                onBanner ? 'text-white/75' : 'text-slate-500',
              )}
            >
              {handle}
            </p>
          ) : null}
        </div>
      </div>

      {profileHref ? (
        <Link
          href={profileHref}
          className={cn(
            'relative inline-flex shrink-0 items-center gap-1.5 self-start text-sm font-medium transition-colors sm:self-center',
            onBanner ? 'text-white hover:text-white/80' : 'text-primary hover:text-primary/80',
          )}
        >
          View profile
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
