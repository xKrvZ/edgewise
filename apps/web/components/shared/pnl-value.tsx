import { formatCurrency, pnlColor } from '@/lib/format';
import { cn } from '@/lib/utils';

interface PnlValueProps {
  value: number | null | undefined;
  className?: string;
  signed?: boolean;
  compact?: boolean;
}

/** Color-coded monetary P&L (emerald positive / red negative). */
export function PnlValue({ value, className, signed, compact }: PnlValueProps) {
  return (
    <span className={cn('tabular-nums font-medium', pnlColor(value), className)}>
      {formatCurrency(value, { signed, compact })}
    </span>
  );
}
