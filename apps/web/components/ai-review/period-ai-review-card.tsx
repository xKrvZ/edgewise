'use client';

import { AiReviewDisplay } from '@/components/ai-review/ai-review-display';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { AiReviewQuery } from '@/lib/types';
import { filtersKey } from '@/lib/hooks/use-global-filters';
import { useQuery } from '@/lib/hooks/use-query';
import { RefreshCw, Sparkles } from 'lucide-react';

interface PeriodAiReviewCardProps {
  filters: AiReviewQuery;
}

export function PeriodAiReviewCard({ filters }: PeriodAiReviewCardProps) {
  const { data, isLoading, isRefetching, error, refetch } = useQuery(
    () => api.aiReview.generate(filters),
    [filtersKey(filters)],
  );

  return (
    <Card className="mt-4">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">AI insights</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={isLoading || isRefetching}
        >
          <RefreshCw className={isRefetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Regenerate
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState
            title="Couldn't generate a review"
            message="Add some trades for this period, or try again once the backend is available."
            onRetry={refetch}
          />
        ) : isLoading ? (
          <AiReviewSkeleton />
        ) : data ? (
          <AiReviewDisplay review={data} variant="compact" />
        ) : null}
      </CardContent>
    </Card>
  );
}

function AiReviewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}
