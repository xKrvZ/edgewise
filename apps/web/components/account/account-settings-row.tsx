'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type StatusBadgeVariant = 'success' | 'secondary' | 'warning' | 'default' | 'outline';

export interface AccountSettingsRowBadge {
  label: string;
  variant?: StatusBadgeVariant;
}

interface AccountSettingsRowProps {
  icon: LucideIcon;
  label: string;
  badge?: AccountSettingsRowBadge;
  description?: string;
  value?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

const badgeVariantMap: Record<StatusBadgeVariant, 'success' | 'secondary' | 'warning' | 'default' | 'outline'> = {
  success: 'success',
  secondary: 'secondary',
  warning: 'warning',
  default: 'default',
  outline: 'outline',
};

export function AccountSettingsRow({
  icon: Icon,
  label,
  badge,
  description,
  value,
  actions,
  className,
}: AccountSettingsRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            {badge ? (
              <Badge variant={badgeVariantMap[badge.variant ?? 'secondary']}>{badge.label}</Badge>
            ) : null}
          </div>
          {description ? <p className="text-xs text-slate-500">{description}</p> : null}
          {value ? <div className="text-sm text-slate-700">{value}</div> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2 sm:pl-4">{actions}</div> : null}
    </div>
  );
}
