'use client';

import { NotificationList } from '@/components/notifications/notification-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import type { Notification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const POLL_INTERVAL_MS = 30_000;

interface NotificationBellProps {
  variant?: 'sidebar' | 'header';
  collapsed?: boolean;
}

export function NotificationBell({ variant = 'header', collapsed }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadQuery = useQuery(() => api.notifications.unreadCount(), [], {
    enabled: true,
  });

  const listQuery = useQuery(() => api.notifications.list({ limit: 20 }), [], {
    enabled: open,
  });

  const refetchUnread = unreadQuery.refetch;
  const refetchList = listQuery.refetch;

  const poll = useCallback(() => {
    refetchUnread();
    if (open) {
      refetchList();
    }
  }, [open, refetchUnread, refetchList]);

  useEffect(() => {
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  useEffect(() => {
    function onFocus() {
      poll();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [poll]);

  async function handleSelect(notification: Notification) {
    if (!notification.read) {
      try {
        await api.notifications.markRead(notification.id);
        unreadQuery.refetch();
        listQuery.refetch();
      } catch {
        // navigation still useful if mark-read fails
      }
    }

    setOpen(false);
    const path =
      notification.targetType === 'trade'
        ? `/trades/${notification.targetId}?comments=1`
        : `/playbooks/${notification.targetId}?comments=1`;
    router.push(path);
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await api.notifications.markAllRead();
      unreadQuery.refetch();
      listQuery.refetch();
    } finally {
      setMarkingAll(false);
    }
  }

  const unread = unreadQuery.data?.count ?? 0;
  const isSidebar = variant === 'sidebar';
  const isHeader = variant === 'header';

  const trigger = (
    <Button
      variant={isSidebar ? 'sidebar' : 'ghost'}
      size={isHeader ? 'icon' : 'icon-sm'}
      className={cn('relative shrink-0', collapsed && 'mx-auto')}
      aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
    >
      <Bell className="h-4 w-4" />
      {unread > 0 && (
        <Badge
          variant="default"
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none"
        >
          {unread > 99 ? '99+' : unread}
        </Badge>
      )}
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Notifications{unread > 0 ? ` (${unread})` : ''}
          </TooltipContent>
        </Tooltip>
      ) : (
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      )}
      <PopoverContent
        align={isHeader ? 'end' : isSidebar ? 'start' : 'end'}
        side={isSidebar ? 'right' : 'bottom'}
        className="w-80 p-0"
      >
        <NotificationList
          notifications={listQuery.data?.items ?? []}
          isLoading={listQuery.isLoading}
          onSelect={handleSelect}
          onMarkAllRead={handleMarkAllRead}
          markingAll={markingAll}
        />
      </PopoverContent>
    </Popover>
  );
}
