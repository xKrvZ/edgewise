'use client';

import { AdminSection } from '@/components/admin/admin-section';
import { ErrorState } from '@/components/shared/error-state';
import { StatCard } from '@/components/shared/stat-card';
import type { ApiError } from '@/lib/api-client';
import { formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

function formatChangeHint(changePercent: number | undefined): string | undefined {
  if (changePercent === undefined || Number.isNaN(changePercent)) {
    return undefined;
  }

  const sign = changePercent > 0 ? '+' : '';
  return `${sign}${formatPercent(changePercent)} vs prior period`;
}

export interface AdminStatsOverviewCard {
  key: string;
  label: string;
  icon: LucideIcon;
  value: string;
  hint?: string;
  changePercent?: number;
  href?: string;
}

interface AdminStatsOverviewProps {
  title?: string;
  description?: string;
  columns?: 3 | 4 | 6;
  cards: AdminStatsOverviewCard[];
  isLoading: boolean;
  error: ApiError | Error | undefined;
  onRetry: () => void;
}

export function AdminStatsOverview({
  title = 'Overview',
  description,
  columns = 4,
  cards,
  isLoading,
  error,
  onRetry,
}: AdminStatsOverviewProps) {
  const gridClass =
    columns === 3
      ? 'grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3'
      : columns === 6
        ? 'grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3'
        : 'grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4';
  return (
    <AdminSection title={title} description={description}>
      {error ? (
        <ErrorState onRetry={onRetry} />
      ) : (
        <div className={gridClass}>
          {cards.map(({ key, label, icon, value, hint, changePercent, href }) => {
            const changeHint = formatChangeHint(changePercent);
            const combinedHint = [changeHint, hint].filter(Boolean).join(' · ') || undefined;

            const card = (
              <StatCard
                label={label}
                icon={icon}
                isLoading={isLoading}
                value={value}
                hint={combinedHint}
                valueClassName={cn(
                  changePercent !== undefined && changePercent > 0 && 'text-emerald-600 dark:text-emerald-400',
                  changePercent !== undefined && changePercent < 0 && 'text-rose-600 dark:text-rose-400',
                )}
              />
            );

            if (!href) {
              return (
                <div key={key} className="h-full">
                  {card}
                </div>
              );
            }

            return (
              <Link
                key={key}
                href={href}
                className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {card}
              </Link>
            );
          })}
        </div>
      )}
    </AdminSection>
  );
}
