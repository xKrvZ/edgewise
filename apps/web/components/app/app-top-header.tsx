'use client';

import { AppBreadcrumbs } from '@/components/app/app-breadcrumbs';
import { NotificationBell } from '@/components/notifications/notification-bell';

export function AppTopHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="min-w-0 flex-1 pl-10 md:pl-0">
        <AppBreadcrumbs />
      </div>
      <NotificationBell variant="header" />
    </header>
  );
}
