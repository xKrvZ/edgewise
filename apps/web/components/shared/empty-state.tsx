import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
  /** Standalone dashed card (default) or compact content for padded table cells. */
  variant?: 'card' | 'embedded';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  variant = 'card',
  className,
}: EmptyStateProps) {
  const content = (
    <>
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-transform duration-150">
        <Icon className="h-7 w-7 text-primary" />
      </span>
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {message && (
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">{message}</p>
        )}
      </div>
      {action && <div className="flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </>
  );

  if (variant === 'embedded') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-border/80 bg-muted/10 px-6 py-10 text-center sm:py-12',
          className,
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'border-dashed bg-muted/20 shadow-none transition-[border-color,background-color] duration-150 hover:border-primary/30 hover:bg-muted/30',
        className,
      )}
    >
      <CardContent className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
        {content}
      </CardContent>
    </Card>
  );
}
