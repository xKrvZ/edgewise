import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PageSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Section wrapper for detail pages — title, optional description, and content block. */
export function PageSection({ title, description, action, children, className }: PageSectionProps) {
  return (
    <section className={cn('space-y-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
