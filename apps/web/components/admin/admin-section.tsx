import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AdminSectionProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

function sectionId(title: string): string {
  return `admin-section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export function AdminSection({
  title,
  description,
  actions,
  children,
  className,
}: AdminSectionProps) {
  const id = sectionId(title);

  return (
    <section className={cn('space-y-4 sm:space-y-5', className)} aria-labelledby={id}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 id={id} className="text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
