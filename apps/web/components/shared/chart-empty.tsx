import { BarChart3 } from 'lucide-react';
import type { ReactNode } from 'react';

interface ChartEmptyProps {
  message?: string;
  action?: ReactNode;
  height?: number | string;
}

/** Quiet empty state for chart card bodies. */
export function ChartEmpty({
  message = 'No data for this period.',
  action,
  height = 240,
}: ChartEmptyProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/20 text-center"
      style={{ height }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
