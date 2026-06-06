import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  valueClassName?: string;
  isLoading?: boolean;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  valueClassName,
  isLoading,
}: StatCardProps) {
  return (
    <Card className="transition-[border-color,box-shadow] duration-150 hover:border-primary/20 hover:shadow-sm">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground/80" />}
        </div>
        {isLoading ? (
          <Skeleton className="mt-1 h-7 w-24" />
        ) : (
          <span
            className={cn('text-2xl font-semibold tracking-tight tabular-nums', valueClassName)}
          >
            {value}
          </span>
        )}
        {hint && !isLoading && <span className="text-xs text-muted-foreground">{hint}</span>}
      </CardContent>
    </Card>
  );
}
