'use client';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TradeAiReviewCard } from '@/components/ai-review/trade-ai-review-card';
import { CommentsSection } from '@/components/comments/comments-section';
import { DetailBackLink } from '@/components/shared/detail-back-link';
import { DetailField } from '@/components/shared/detail-field';
import { ErrorState } from '@/components/shared/error-state';
import { InlineStat } from '@/components/shared/inline-stat';
import { PageBody } from '@/components/shared/page-body';
import { ScreenshotGallery } from '@/components/shared/screenshot-gallery';
import { DirectionBadge } from '@/components/trades/direction-badge';
import { TradeSharingDialog } from '@/components/share/trade-sharing-dialog';
import { TradeFormDialog } from '@/components/trades/trade-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { formatCurrency, formatDateTime, formatR, pnlColor } from '@/lib/format';
import { useQuery } from '@/lib/hooks/use-query';
import { useReferenceData } from '@/lib/hooks/use-reference-data';
import { resolveTradeMistakes, resolveTradeTags } from '@/lib/trade-relations';
import { cn } from '@/lib/utils';
import { Pencil, Play, Share2, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function TradeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusComments = searchParams.get('comments') === '1';
  const { playbooks, sessions, tags, mistakes } = useReferenceData();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const { data: trade, isLoading, error, refetch } = useQuery(() => api.trades.get(id), [id]);

  async function confirmDelete() {
    try {
      await api.trades.remove(id);
      toast.success('Trade deleted');
      router.push('/trades');
    } catch {
      toast.error('Failed to delete trade');
    }
  }

  if (error) {
    return (
      <PageBody>
        <DetailBackLink href="/trades" label="Back to trades" />
        <ErrorState
          title="Trade not found"
          message="This trade may have been deleted or the backend is unavailable."
          onRetry={refetch}
        />
      </PageBody>
    );
  }

  if (isLoading || !trade) {
    return (
      <PageBody>
        <DetailBackLink href="/trades" label="Back to trades" />
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton tiles
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-48 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
      </PageBody>
    );
  }

  const playbookName = trade.playbookId
    ? (playbooks.find((p) => p.id === trade.playbookId)?.name ?? '—')
    : '—';
  const sessionName = trade.sessionId
    ? (sessions.find((s) => s.id === trade.sessionId)?.name ?? '—')
    : '—';
  const resolvedTags = resolveTradeTags(trade, tags);
  const resolvedMistakes = resolveTradeMistakes(trade, mistakes);

  return (
    <PageBody>
      <DetailBackLink href="/trades" label="Back to trades" />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{trade.symbol}</h1>
          <DirectionBadge direction={trade.direction} />
          <Badge variant="secondary" className="capitalize">
            {trade.marketType}
          </Badge>
          <Badge variant={trade.status === 'open' ? 'outline' : 'secondary'} className="capitalize">
            {trade.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/replay?tradeId=${trade.id}`}>
              <Play className="h-4 w-4" />
              Replay
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InlineStat
          label="Net P&L"
          value={formatCurrency(trade.pnl, { signed: true })}
          valueClassName={pnlColor(trade.pnl)}
        />
        <InlineStat
          label="R-multiple"
          value={formatR(trade.rMultiple)}
          valueClassName={pnlColor(trade.rMultiple)}
        />
        <InlineStat label="Quantity" value={String(trade.quantity)} />
        <InlineStat label="Fees" value={formatCurrency(trade.fees)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Execution</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            <DetailField label="Entry price" value={formatCurrency(trade.entryPrice)} />
            <DetailField
              label="Exit price"
              value={trade.exitPrice === null ? '—' : formatCurrency(trade.exitPrice)}
            />
            <DetailField
              label="Stop loss"
              value={trade.stopLoss === null ? '—' : formatCurrency(trade.stopLoss)}
            />
            <DetailField
              label="Take profit"
              value={trade.takeProfit === null ? '—' : formatCurrency(trade.takeProfit)}
            />
            <DetailField label="Entry time" value={formatDateTime(trade.entryTime)} />
            <DetailField label="Exit time" value={formatDateTime(trade.exitTime)} />
            <DetailField label="Setup" value={playbookName} />
            <DetailField label="Session" value={sessionName} />
            <DetailField label="Emotion" value={trade.emotion ?? '—'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Execution rating
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <Star
                    key={r}
                    className={cn(
                      'h-5 w-5',
                      (trade.executionRating ?? 0) >= r
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground/40',
                    )}
                  />
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tags
              </p>
              <div className="flex flex-wrap gap-1">
                {resolvedTags.length === 0 ? (
                  <span className="text-sm text-muted-foreground">None</span>
                ) : (
                  resolvedTags.map((t) => (
                    <Badge key={t.id} variant="secondary">
                      {t.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Mistakes
              </p>
              <div className="flex flex-wrap gap-1">
                {resolvedMistakes.length === 0 ? (
                  <span className="text-sm text-muted-foreground">None</span>
                ) : (
                  resolvedMistakes.map((m) => (
                    <Badge
                      key={m.id}
                      variant="outline"
                      className="border-destructive/30 text-destructive"
                    >
                      {m.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {trade.notes ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {trade.notes}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No notes recorded for this trade.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Screenshots</CardTitle>
        </CardHeader>
        <CardContent>
          <ScreenshotGallery tradeId={trade.id} />
        </CardContent>
      </Card>

      <TradeAiReviewCard tradeId={trade.id} />

      <CommentsSection targetType="trade" targetId={trade.id} focus={focusComments} />

      <TradeFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        trade={trade}
        onSaved={() => refetch()}
      />
      <TradeSharingDialog
        trade={trade}
        open={shareOpen}
        onOpenChange={setShareOpen}
        onUpdated={() => refetch()}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this trade?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </PageBody>
  );
}
