import { Badge } from '@/components/ui/badge';
import type { TradeDirection } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export function DirectionBadge({ direction }: { direction: TradeDirection }) {
  const long = direction === 'long';
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 capitalize',
        long
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-destructive/30 bg-destructive/10 text-destructive',
      )}
    >
      {long ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {direction}
    </Badge>
  );
}
