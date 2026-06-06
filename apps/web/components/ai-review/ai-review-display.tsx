import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDateTime, formatPercent, pnlColor } from '@/lib/format';
import type { AiReview, AiSetupSummary } from '@/lib/types';
import type { LucideIcon } from 'lucide-react';
import {
  Clock,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';

interface AiReviewDisplayProps {
  review: AiReview;
  variant?: 'full' | 'compact';
}

export function AiReviewDisplay({ review, variant = 'full' }: AiReviewDisplayProps) {
  if (variant === 'compact') {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Session summary</p>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{review.summary}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Generated {formatDateTime(review.generatedAt)}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <CompactHighlight
            title="Biggest weakness"
            icon={TriangleAlert}
            content={review.biggestWeakness}
          />
          <CompactHighlight
            title="Focus next"
            icon={Lightbulb}
            items={review.suggestedFocus.slice(0, 2)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="flex-row items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm leading-relaxed text-foreground/90">
            {review.summary || 'No summary available for this period.'}
          </p>
          <p className="text-xs text-muted-foreground">
            Generated {formatDateTime(review.generatedAt)}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-warning" />
            <CardTitle className="text-base">Biggest weakness</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/90">
              {review.biggestWeakness || 'Nothing major flagged.'}
            </p>
          </CardContent>
        </Card>

        <SetupCard title="Best setup" icon={TrendingUp} setup={review.bestSetup} accent="text-primary" />
        <SetupCard
          title="Worst setup"
          icon={TrendingDown}
          setup={review.worstSetup}
          accent="text-destructive"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightList
          title="Overtrading warnings"
          icon={ShieldAlert}
          items={review.overtradingWarnings}
          tone="warning"
        />
        <InsightList title="Time-of-day insights" icon={Clock} items={review.timeOfDayInsights} />
        <InsightList
          title="Rule-breaking patterns"
          icon={TriangleAlert}
          items={review.ruleBreakingPatterns}
          tone="destructive"
        />
        <InsightList
          title="Focus for next week"
          icon={Lightbulb}
          items={review.suggestedFocus}
          tone="primary"
        />
      </div>
    </div>
  );
}

function CompactHighlight({
  title,
  icon: Icon,
  content,
  items,
}: {
  title: string;
  icon: LucideIcon;
  content?: string;
  items?: string[];
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">{title}</p>
      </div>
      {content ? (
        <p className="text-sm text-foreground/90">{content}</p>
      ) : items && items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground/90">
              <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing flagged here.</p>
      )}
    </div>
  );
}

function SetupCard({
  title,
  icon: Icon,
  setup,
  accent,
}: {
  title: string;
  icon: LucideIcon;
  setup: AiSetupSummary | null;
  accent: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <Icon className={`h-4 w-4 ${accent}`} />
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {setup ? (
          <div className="space-y-1">
            <p className="font-medium">{setup.label}</p>
            <p className={`text-sm ${pnlColor(setup.netPnl)}`}>
              {formatCurrency(setup.netPnl, { signed: true })} · {formatPercent(setup.winRate)} win
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not enough data.</p>
        )}
      </CardContent>
    </Card>
  );
}

function InsightList({
  title,
  icon: Icon,
  items,
  tone = 'muted',
}: {
  title: string;
  icon: LucideIcon;
  items: string[];
  tone?: 'muted' | 'warning' | 'destructive' | 'primary';
}) {
  const dot = {
    muted: 'bg-muted-foreground',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    primary: 'bg-primary',
  }[tone];

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">{title}</CardTitle>
        {items.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {items.length}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing flagged here. Keep it up.</p>
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
      </CardContent>
    </Card>
  );
}
