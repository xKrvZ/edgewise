'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { SubscriptionStatus } from '@/lib/types/billing';

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

interface SubscriptionBadgeProps {
  status: SubscriptionStatus | null;
  isLoading?: boolean;
}

export function SubscriptionBadge({ status, isLoading }: SubscriptionBadgeProps) {
  if (isLoading) {
    return <Skeleton className="h-6 w-36 rounded-full" />;
  }

  const active = status?.active ?? false;
  const label = active ? 'Active subscription' : 'No active subscription';
  const detail = status?.status && status.status !== 'inactive' ? formatStatus(status.status) : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={active ? 'default' : 'secondary'}>{label}</Badge>
      {detail ? (
        <span className="text-sm text-muted-foreground capitalize">{detail}</span>
      ) : null}
      {status?.provider === 'mock' ? (
        <span className="text-xs text-muted-foreground">(dev mock billing)</span>
      ) : null}
      {status?.currentPeriodEnd ? (
        <span className="text-xs text-muted-foreground">
          Renews {new Date(status.currentPeriodEnd).toLocaleDateString()}
        </span>
      ) : null}
    </div>
  );
}
