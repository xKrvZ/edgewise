'use client';

import { ErrorState } from '@/components/shared/error-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { formatDateTime } from '@/lib/format';
import { useQuery } from '@/lib/hooks/use-query';
import { Lightbulb, RefreshCw, Sparkles, TriangleAlert } from 'lucide-react';

interface TradeAiReviewCardProps {
  tradeId: string;
}

export function TradeAiReviewCard({ tradeId }: TradeAiReviewCardProps) {
  const { data, isLoading, isRefetching, error, refetch } = useQuery(
    () => api.aiReview.generateForTrade(tradeId),
    [tradeId],
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">AI review</CardTitle>
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
            message="Try again once the backend is available."
            onRetry={refetch}
          />
        ) : isLoading ? (
          <TradeReviewSkeleton />
        ) : data ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm leading-relaxed text-foreground/90">{data.summary}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Generated {formatDateTime(data.generatedAt)}
              </p>
            </div>

            <ReviewSection title="Insights" icon={Sparkles} items={data.insights} />
            <ReviewSection
              title="Mistakes flagged"
              icon={TriangleAlert}
              items={data.mistakesFlagged}
              emptyMessage="No mistakes flagged on this trade."
              tone="destructive"
            />
            <ReviewSection
              title="Suggestions"
              icon={Lightbulb}
              items={data.suggestions}
              tone="primary"
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReviewSection({
  title,
  icon: Icon,
  items,
  emptyMessage = 'Nothing here.',
  tone = 'muted',
}: {
  title: string;
  icon: typeof Sparkles;
  items: string[];
  emptyMessage?: string;
  tone?: 'muted' | 'destructive' | 'primary';
}) {
  const dot = {
    muted: 'bg-muted-foreground',
    destructive: 'bg-destructive',
    primary: 'bg-primary',
  }[tone];

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">{title}</p>
        {items.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {items.length}
          </Badge>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
              <span className="text-foreground/90">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TradeReviewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}
