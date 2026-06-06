'use client';

import { NAV_SECTIONS } from '@/components/app/nav-config';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarNavProps {
  onNavigate?: () => void;
  showSectionLabel?: boolean;
  collapsed?: boolean;
}

export function SidebarNav({
  onNavigate,
  showSectionLabel = true,
  collapsed = false,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden',
        collapsed ? 'p-2' : 'p-3',
      )}
    >
      {NAV_SECTIONS.map((section, sectionIndex) => (
        <div
          key={section.label}
          className={cn('space-y-0.5', sectionIndex > 0 && !collapsed && 'pt-1')}
        >
          {showSectionLabel && !collapsed && (
            <p className="px-3 pt-1 pb-2 text-[0.6875rem] font-semibold tracking-widest text-sidebar-muted-foreground uppercase">
              {section.label}
            </p>
          )}
          {section.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            const link = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? undefined : item.label}
                className={cn(
                  'group relative flex items-center rounded-md text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                )}
              >
                <span
                  className={cn(
                    'absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary transition-opacity',
                    active ? 'opacity-100' : 'opacity-0',
                    collapsed && 'left-0.5',
                  )}
                />
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    active
                      ? 'text-sidebar-primary'
                      : 'text-sidebar-muted-foreground group-hover:text-sidebar-accent-foreground',
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );

            if (!collapsed) return link;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
