'use client';

import { ErrorState } from '@/components/shared/error-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, api } from '@/lib/api-client';
import { formatDateTime } from '@/lib/format';
import { useQuery } from '@/lib/hooks/use-query';
import { useSubscription } from '@/lib/hooks/use-subscription';
import type { TradeAiReview } from '@/lib/types';
import { Lightbulb, Sparkles, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

interface TradeAiReviewCardProps {
  tradeId: string;
}

export function TradeAiReviewCard({ tradeId }: TradeAiReviewCardProps) {
  const { status, isLoading: subscriptionLoading, refetch: refetchSubscription } = useSubscription();
  const [isRequesting, setIsRequesting] = useState(false);

  const {
    data: review,
    isLoading,
    error,
    refetch,
  } = useQuery<TradeAiReview | null>(
    async () => {
      try {
        return await api.aiReview.getTradeReview(tradeId);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
    [tradeId],
  );

  const unlimited = status?.aiReviewTokensUnlimited ?? false;
  const tokensRemaining = status?.aiReviewTokensRemaining;
  const tokensLimit = status?.aiReviewTokensLimit;
  const canRequest =
    subscriptionLoading ||
    unlimited ||
    (tokensRemaining != null && tokensRemaining > 0);

  const tokenLabel = unlimited
    ? 'Unlimited AI reviews'
    : tokensRemaining != null && tokensLimit != null
      ? `${tokensRemaining} of ${tokensLimit} AI review tokens left this month`
      : undefined;

  async function handleRequest() {
    if (review) {
      return;
    }

    setIsRequesting(true);
    try {
      await api.aiReview.requestTradeReview(tradeId);
      await refetch();
      await refetchSubscription();
      toast.success('AI review generated');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to request AI review');
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to request AI review');
      }
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">AI review</CardTitle>
          {tokenLabel ? (
            <Badge variant="secondary" className="font-normal">
              {tokenLabel}
            </Badge>
          ) : null}
        </div>
        {!review ? (
          <Button
            size="sm"
            onClick={() => void handleRequest()}
            disabled={isLoading || isRequesting || !canRequest}
          >
            <Sparkles className="h-4 w-4" />
            {isRequesting ? 'Generating…' : 'Request AI review'}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState
            title="Couldn't load AI review"
            message="Try again once the backend is available."
            onRetry={refetch}
          />
        ) : isLoading ? (
          <TradeReviewSkeleton />
        ) : review ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm leading-relaxed text-foreground/90">{review.summary}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Generated {formatDateTime(review.generatedAt)}
              </p>
            </div>

            <ReviewSection title="Insights" icon={Sparkles} items={review.insights} />
            <ReviewSection
              title="Mistakes flagged"
              icon={TriangleAlert}
              items={review.mistakesFlagged}
              emptyMessage="No mistakes flagged on this trade."
              tone="destructive"
            />
            <ReviewSection
              title="Suggestions"
              icon={Lightbulb}
              items={review.suggestions}
              tone="primary"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Request an on-demand AI review for this trade. Each review uses one token from your
              monthly allowance.
            </p>
            {!canRequest && !unlimited ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
                <p>You have no AI review tokens left this month.</p>
                <Button variant="link" className="h-auto p-0 text-amber-950" asChild>
                  <Link href="/pricing">Upgrade your plan for more reviews</Link>
                </Button>
              </div>
            ) : null}
          </div>
        )}
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
