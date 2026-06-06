'use client';

import { cn } from '@/lib/utils';

export interface ListMetric {
  label: string;
  value: string;
  valueClassName?: string;
}

interface ListMetricsBarProps {
  metrics: ListMetric[];
  ariaLabel: string;
  className?: string;
}

export function ListMetricsBar({ metrics, ariaLabel, className }: ListMetricsBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center rounded-lg border border-border/60 bg-muted/60 px-3 py-2.5 shadow-xs sm:px-4',
        className,
      )}
      role="status"
      aria-label={ariaLabel}
    >
      {metrics.map((metric, index) => (
        <div key={metric.label} className="flex items-center">
          {index > 0 && (
            <span
              className="mx-3 hidden h-3.5 w-px shrink-0 bg-border sm:block"
              aria-hidden
            />
          )}
          <div className="flex items-baseline gap-1.5 py-1 sm:py-0">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {metric.label}
            </span>
            <span
              className={cn(
                'text-sm font-semibold tabular-nums tracking-tight text-foreground',
                metric.valueClassName,
              )}
            >
              {metric.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
