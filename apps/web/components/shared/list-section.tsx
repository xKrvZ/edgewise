'use client';

import { cn } from '@/lib/utils';

interface ListSectionProps {
  title: string;
  countLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export function ListSection({ title, countLabel, children, className }: ListSectionProps) {
  return (
    <section className={cn('space-y-6', className)}>
      <div className="flex items-baseline justify-between gap-3 border-b border-border/80 pb-4">
        <h2 className="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        {countLabel && (
          <span className="text-xs font-medium tabular-nums text-muted-foreground">{countLabel}</span>
        )}
      </div>
      {children}
    </section>
  );
}
