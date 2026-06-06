'use client';

import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api-client';
import { formatDateTime } from '@/lib/format';
import type { Notification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCheck, MessageSquare } from 'lucide-react';

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  onSelect: (notification: Notification) => void;
  onMarkAllRead: () => void;
  markingAll?: boolean;
}

function notificationLabel(notification: Notification): string {
  const action = notification.type === 'reply' ? 'replied to a comment on' : 'commented on';
  const target = notification.targetType === 'trade' ? 'your trade' : 'your playbook';
  return `${notification.actorName} ${action} ${target}`;
}

export function NotificationList({
  notifications,
  isLoading,
  onSelect,
  onMarkAllRead,
  markingAll,
}: NotificationListProps) {
  const hasUnread = notifications.some((n) => !n.read);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">Loading…</div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No notifications yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">Notifications</p>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onMarkAllRead}
            disabled={markingAll}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>
      <ScrollArea className="max-h-80">
        <ul className="divide-y divide-border">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <button
                type="button"
                onClick={() => onSelect(notification)}
                className={cn(
                  'flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50',
                  !notification.read && 'bg-primary/5',
                )}
              >
                <UserAvatar
                  name={notification.actorName}
                  image={notification.actorImage}
                  className="mt-0.5 h-8 w-8 shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{notificationLabel(notification)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {notification.communityName} · {formatDateTime(notification.createdAt)}
                  </p>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
