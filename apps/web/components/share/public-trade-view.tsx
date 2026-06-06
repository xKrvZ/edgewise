import { DetailField } from '@/components/shared/detail-field';
import { InlineStat } from '@/components/shared/inline-stat';
import { DirectionBadge } from '@/components/trades/direction-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDateTime, formatR, pnlColor } from '@/lib/format';
import type { PublicTrade } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface PublicTradeViewProps {
  trade: PublicTrade;
}

export function PublicTradeView({ trade }: PublicTradeViewProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-4 border-b border-border/60 pb-6">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-primary">
          Shared trade
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{trade.symbol}</h1>
          <DirectionBadge direction={trade.direction} />
          <Badge variant="secondary" className="capitalize">
            {trade.marketType}
          </Badge>
          <Badge variant={trade.status === 'open' ? 'outline' : 'secondary'} className="capitalize">
            {trade.status}
          </Badge>
          {trade.visibility === 'unlisted' && (
            <Badge variant="outline" className="text-muted-foreground">
              Unlisted
            </Badge>
          )}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
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

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
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
            <DetailField label="Setup" value={trade.setupName ?? '—'} />
            <DetailField label="Session" value={trade.sessionName ?? '—'} />
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
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tags
              </p>
              <div className="flex flex-wrap gap-1">
                {trade.tagNames.length === 0 ? (
                  <span className="text-sm text-muted-foreground">None</span>
                ) : (
                  trade.tagNames.map((name) => (
                    <Badge key={name} variant="secondary">
                      {name}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {trade.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {trade.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {trade.media.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Screenshots &amp; videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trade.media.map((item) => (
                <figure
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-border bg-muted/20 transition-[border-color,box-shadow] duration-150 hover:border-primary/25 hover:shadow-sm"
                >
                  {item.kind === 'video' ? (
                    // biome-ignore lint/a11y/useMediaCaption: user-generated trade clips have no captions track.
                    <video
                      src={item.url}
                      controls
                      preload="metadata"
                      className="aspect-video w-full bg-black object-contain"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.caption ?? 'Trade screenshot'}
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  {item.caption && (
                    <figcaption className="truncate px-2 py-1.5 text-xs text-muted-foreground">
                      {item.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
