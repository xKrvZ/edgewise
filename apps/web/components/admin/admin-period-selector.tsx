'use client';

import { Button } from '@/components/ui/button';
import type { AdminStatsPeriod } from '@/lib/types/admin';
import { cn } from '@/lib/utils';

export const ADMIN_STATS_PERIODS: { value: AdminStatsPeriod; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
];

export const ADMIN_PERIOD_LABELS: Record<AdminStatsPeriod, string> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
};

interface AdminPeriodSelectorProps {
  period: AdminStatsPeriod;
  onChange: (period: AdminStatsPeriod) => void;
  className?: string;
  'aria-label'?: string;
}

export function AdminPeriodSelector({
  period,
  onChange,
  className,
  'aria-label': ariaLabel = 'Chart time period',
}: AdminPeriodSelectorProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/60 p-1',
        className,
      )}
    >
      {ADMIN_STATS_PERIODS.map(({ value, label }) => (
        <Button
          key={value}
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={period === value}
          className={cn(
            'h-7 rounded-md px-2.5 text-xs font-medium',
            period === value
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => onChange(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
