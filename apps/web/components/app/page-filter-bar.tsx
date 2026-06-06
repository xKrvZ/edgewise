import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PageFilterBarProps {
  children: ReactNode;
  className?: string;
}

/** Consistent toolbar row for page-level filters (date range, search, etc.). */
export function PageFilterBar({ children, className }: PageFilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/80 p-3 shadow-xs',
        className,
      )}
    >
      {children}
    </div>
  );
}
