import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface AccountHubStatCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  iconClassName?: string;
  className?: string;
}

export function AccountHubStatCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconClassName,
  className,
}: AccountHubStatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5',
        className,
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-sm font-medium text-slate-500">{label}</p>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary',
              iconClassName,
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight tabular-nums text-slate-950">{value}</p>
        <p className="text-xs text-slate-500">{subtext}</p>
      </div>
    </div>
  );
}
