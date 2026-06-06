'use client';

import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTableContent,
  CardTitle,
  cardSectionPaddingClass,
  cardTableStatePaddingClass,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import { resolveUserDisplayLabel } from '@/lib/user-display';
import type { AdminAuditEntry, AdminAuditPage } from '@/lib/types/admin';
import {
  Ban,
  ClipboardList,
  CreditCard,
  RefreshCw,
  Shield,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AdminAuditLogProps {
  /** When false, omit the card header (use with AdminSection). */
  showHeader?: boolean;
  title?: string;
  description?: string;
  entries: AdminAuditEntry[];
  total: number;
  limit: number;
  offset: number;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onPageChange?: (offset: number) => void;
  showSubject?: boolean;
  showActor?: boolean;
  emptyMessage?: string;
}

const EVENT_ICONS: Record<string, LucideIcon> = {
  'user.registered': UserPlus,
  'subscription.active': CreditCard,
  'subscription.canceled': CreditCard,
  'subscription.revoked': CreditCard,
  'order.paid': CreditCard,
  'order.refunded': CreditCard,
  'admin.user.banned': Ban,
  'admin.user.unbanned': Ban,
  'admin.user.role_changed': Shield,
  'admin.subscription.override': CreditCard,
  'admin.discount.granted': CreditCard,
};

function userLabel(entry: AdminAuditEntry, field: 'subject' | 'actor'): string | null {
  if (field === 'subject') {
    return (
      resolveUserDisplayLabel({
        displayName: entry.subjectDisplayName,
        name: entry.subjectName,
        email: entry.subjectEmail,
      }) || null
    );
  }

  return (
    resolveUserDisplayLabel({
      displayName: entry.actorDisplayName,
      name: entry.actorName,
      email: entry.actorEmail,
    }) || null
  );
}

function userId(entry: AdminAuditEntry, field: 'subject' | 'actor'): string | null {
  return field === 'subject' ? entry.subjectUserId : entry.actorUserId;
}

function AuditEventIcon({ type }: { type: string }) {
  const Icon = EVENT_ICONS[type] ?? ClipboardList;

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}

export function AdminAuditLog({
  showHeader = true,
  title,
  description,
  entries,
  total,
  limit,
  offset,
  isLoading,
  error,
  onRetry,
  onPageChange,
  showSubject = false,
  showActor = true,
  emptyMessage = 'No audit events recorded yet.',
}: AdminAuditLogProps) {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canPrev = offset > 0;
  const canNext = offset + limit < total;
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + entries.length, total);

  const feedLabel = title ?? 'Audit log';

  return (
    <Card className="h-full gap-0 overflow-hidden">
      {showHeader && title ? (
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </CardHeader>
      ) : null}
      <CardTableContent>
        {error ? (
          <div className={cardTableStatePaddingClass}>
            <div
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <p>{error}</p>
              {onRetry ? (
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              ) : null}
            </div>
          </div>
        ) : isLoading ? (
          <div className={cardTableStatePaddingClass}>
            <div
              className="divide-y divide-border rounded-lg border border-border"
              aria-busy="true"
              aria-label="Loading audit events"
            >
              {Array.from({ length: 3 }).map((_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows
                <div key={index} className="flex gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-full max-w-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className={cardTableStatePaddingClass}>
            <EmptyState
              variant="embedded"
              icon={ClipboardList}
              title="No activity yet"
              message={emptyMessage}
            />
          </div>
        ) : (
          <ul
            role="feed"
            aria-label={feedLabel}
            className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-muted/5"
          >
            {entries.map((entry) => (
              <li key={entry.id} className="px-4 py-4 transition-colors hover:bg-muted/30 sm:px-5">
                <div className="flex gap-3 sm:gap-4">
                  <AuditEventIcon type={entry.type} />
                  <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-sm font-medium leading-snug text-foreground">
                          {entry.label}
                        </p>
                        <Badge
                          variant="outline"
                          className="border-border/80 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                        >
                          {entry.source}
                        </Badge>
                      </div>
                      {entry.detail ? (
                        <p className="text-sm leading-relaxed text-muted-foreground">{entry.detail}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {showSubject && userId(entry, 'subject') ? (
                          <span>
                            User{' '}
                            <Link
                              href={`/admin/users/${userId(entry, 'subject')}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {userLabel(entry, 'subject') ?? userId(entry, 'subject')}
                            </Link>
                          </span>
                        ) : null}
                        {showActor && userId(entry, 'actor') ? (
                          <span>
                            By{' '}
                            <Link
                              href={`/admin/users/${userId(entry, 'actor')}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {userLabel(entry, 'actor') ?? userId(entry, 'actor')}
                            </Link>
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <time
                      className="shrink-0 text-xs tabular-nums text-muted-foreground sm:pt-0.5 sm:text-right"
                      dateTime={entry.occurredAt}
                      title={formatDateTime(entry.occurredAt)}
                    >
                      {formatRelativeTime(entry.occurredAt)}
                    </time>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!isLoading && !error && total > limit && onPageChange ? (
          <div
            className={cn(
              cardSectionPaddingClass,
              'flex flex-col gap-3 border-t border-border/60 py-4 sm:flex-row sm:items-center sm:justify-between',
            )}
          >
            <p className="text-xs leading-relaxed text-muted-foreground">
              Showing {rangeStart}–{rangeEnd} of {total}
              <span className="hidden sm:inline"> · </span>
              <span className="block sm:inline">
                Page {page} of {totalPages}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canPrev}
                onClick={() => onPageChange(Math.max(0, offset - limit))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={() => onPageChange(offset + limit)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </CardTableContent>
    </Card>
  );
}

export function toAuditPage(data: AdminAuditPage | undefined) {
  return {
    entries: data?.items ?? [],
    total: data?.total ?? 0,
    limit: data?.limit ?? 25,
    offset: data?.offset ?? 0,
  };
}
