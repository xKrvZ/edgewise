'use client';

import { AccountSelector } from '@/components/app/account-selector';
import { Logo } from '@/components/app/logo';
import { SidebarCollapseToggle } from '@/components/app/sidebar-collapse-toggle';
import { SidebarNav } from '@/components/app/sidebar-nav';
import { UserMenu } from '@/components/app/user-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebar-store';
import { Menu } from 'lucide-react';
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
        <SheetHeader className="flex h-14 shrink-0 flex-row items-center border-b border-sidebar-border px-4">
          <SheetTitle asChild>
            <Logo variant="dark" />
          </SheetTitle>
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

export function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);

  return (
    <>
      <MobileSidebar />
      <div
        className={cn(
          'relative hidden h-full shrink-0 transition-[width] duration-200 ease-out md:block',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <aside
          data-collapsed={collapsed ? 'true' : 'false'}
          className="flex h-full w-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
        >
          <div
            className={cn(
              'flex h-14 shrink-0 items-center border-b border-sidebar-border',
              collapsed ? 'justify-center px-2' : 'px-3',
            )}
          >
            <Link
              href="/dashboard"
              className={cn('min-w-0', collapsed ? 'flex justify-center px-1' : 'px-2')}
              aria-label="My Journal"
            >
              <Logo variant="dark" mark={collapsed} className="min-w-0" />
            </Link>
          </div>

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
          <UserMenu variant="sidebar" collapsed={collapsed} />
        </div>
        </aside>
        <SidebarCollapseToggle collapsed={collapsed} />
      </div>
    </>
  );
}
