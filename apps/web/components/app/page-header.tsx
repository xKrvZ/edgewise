import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title?: string;
  description?: string;
  eyebrow?: string;
  /** Renders below the title and description in the left column (e.g. date filters). */
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  filters,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6',
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow && (
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-primary">
            {eyebrow}
          </p>
        )}
        {title && (
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        )}
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
        {filters && <div className="flex flex-wrap items-center gap-3 pt-3">{filters}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
