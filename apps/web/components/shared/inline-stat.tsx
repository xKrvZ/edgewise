import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InlineStatProps {
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
}

/** Compact KPI tile for detail and public share pages. */
export function InlineStat({ label, value, valueClassName, className }: InlineStatProps) {
  return (
    <Card
      className={cn(
        'transition-[border-color,box-shadow] duration-150 hover:border-primary/25 hover:shadow-sm',
        className,
      )}
    >
      <CardContent>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn('mt-1.5 text-2xl font-semibold tracking-tight tabular-nums', valueClassName)}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
