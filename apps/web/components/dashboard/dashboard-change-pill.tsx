import { formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface DashboardChangePillProps {
  value: number | null;
  className?: string;
}

export function DashboardChangePill({ value, className }: DashboardChangePillProps) {
  if (value === null || Number.isNaN(value)) return null;

  const positive = value >= 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        positive
          ? 'border border-success/25 bg-success/10 text-success'
          : 'border border-destructive/25 bg-destructive/10 text-destructive',
        className,
      )}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {formatPercent(Math.abs(value))}
    </span>
  );
}
