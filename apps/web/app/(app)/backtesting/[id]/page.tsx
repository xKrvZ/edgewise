'use client';

import { BacktestWorkspace } from '@/components/backtesting/backtest-workspace';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Backtest } from '@/lib/types';

export default function BacktestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [backtest, setBacktest] = useState<Backtest | null>(null);

  const { data, isLoading, error, refetch } = useQuery(() => api.backtests.get(id), [id]);

  useEffect(() => {
    if (data) setBacktest(data);
  }, [data]);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  if (isLoading || !backtest) {
    return <Skeleton className="h-full w-full rounded-none" />;
  }

  return (
    <BacktestWorkspace
      backtest={backtest}
      onBacktestUpdated={(updated) => {
        setBacktest(updated);
        if (updated.id !== id) {
          router.replace(`/backtesting/${updated.id}`);
        }
      }}
    />
  );
}
