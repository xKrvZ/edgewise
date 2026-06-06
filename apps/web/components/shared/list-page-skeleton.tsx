import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ListPageSkeletonProps {
  /** Number of list row skeletons below the featured card. */
  rows?: number;
  /** Show metrics bar skeleton. */
  metrics?: boolean;
  /** Show featured hero card skeleton. */
  featured?: boolean;
  className?: string;
}

export function ListPageSkeleton({
  rows = 6,
  metrics = true,
  featured = true,
  className,
}: ListPageSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {metrics && <Skeleton className="h-11 w-full rounded-lg" />}
      {featured && <Skeleton className="h-28 w-full rounded-xl" />}
      <Card>
        <CardContent className="space-y-2 py-4">
          {Array.from({ length: rows }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton rows
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
