'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebarStore } from '@/stores/sidebar-store';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function SidebarCollapseToggle({ collapsed }: { collapsed: boolean }) {
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggle}
          className="absolute top-7 right-0 z-50 aspect-square size-6 min-h-6 min-w-6 shrink-0 -translate-y-1/2 translate-x-1/2 rounded-full border-0 bg-white p-0 shadow-sm hover:bg-white hover:text-primary active:translate-x-1/2 active:-translate-y-1/2 focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="size-4 shrink-0 text-primary" />
          ) : (
            <ChevronLeft className="size-4 shrink-0 text-primary" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      </TooltipContent>
    </Tooltip>
  );
}
