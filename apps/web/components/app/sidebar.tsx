'use client';

import { AccountSelector } from '@/components/app/account-selector';
import { Logo } from '@/components/app/logo';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { SidebarNav } from '@/components/app/sidebar-nav';
import { UserMenu } from '@/components/app/user-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebar-store';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed left-3 top-3 z-40 bg-background/90 shadow-sm backdrop-blur md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex h-full w-64 flex-col gap-0 border-sidebar-border p-0"
      >
        <SheetHeader className="flex h-14 shrink-0 flex-row items-center justify-between border-b border-sidebar-border px-4">
          <SheetTitle asChild>
            <Logo variant="dark" />
          </SheetTitle>
          <NotificationBell variant="sidebar" />
        </SheetHeader>
        <div className="shrink-0 border-b border-sidebar-border px-3 py-3">
          <AccountSelector variant="sidebar" />
        </div>
        <SidebarNav onNavigate={() => setOpen(false)} showSectionLabel={false} />
        <div className="mt-auto shrink-0 border-t border-sidebar-border px-3 py-3">
          <UserMenu variant="sidebar" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CollapseToggle({ collapsed }: { collapsed: boolean }) {
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="sidebar"
          size="icon-sm"
          onClick={toggle}
          className="shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      </TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);

  return (
    <>
      <MobileSidebar />
      <aside
        data-collapsed={collapsed ? 'true' : 'false'}
        className={cn(
          'hidden h-full shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out md:flex',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b border-sidebar-border',
            collapsed ? 'justify-center px-2' : 'justify-between px-3',
          )}
        >
          <Link
            href="/dashboard"
            className={cn('min-w-0', collapsed && 'flex justify-center')}
            aria-label="Edgewise dashboard"
          >
            <Logo variant="dark" className={cn(collapsed && 'max-w-12')} />
          </Link>
          {!collapsed && (
            <div className="flex items-center gap-1">
              <NotificationBell variant="sidebar" />
              <CollapseToggle collapsed={collapsed} />
            </div>
          )}
        </div>

        {collapsed && (
          <div className="flex shrink-0 justify-center border-b border-sidebar-border py-2">
            <CollapseToggle collapsed={collapsed} />
          </div>
        )}

        <div
          className={cn(
            'shrink-0 border-b border-sidebar-border',
            collapsed ? 'flex justify-center px-2 py-2' : 'px-3 py-3',
          )}
        >
          <AccountSelector variant="sidebar" collapsed={collapsed} />
        </div>

        <SidebarNav collapsed={collapsed} />

        <div
          className={cn(
            'mt-auto shrink-0 border-t border-sidebar-border',
            collapsed ? 'flex flex-col items-center gap-2 px-2 py-2' : 'px-3 py-3',
          )}
        >
          {collapsed && <NotificationBell variant="sidebar" collapsed />}
          <UserMenu variant="sidebar" collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}
