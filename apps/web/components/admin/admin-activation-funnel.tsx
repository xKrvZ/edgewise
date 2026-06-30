'use client';

import { ADMIN_PERIOD_LABELS } from '@/components/admin/admin-period-selector';
import { AdminPostHogPoweredBadge } from '@/components/admin/admin-posthog-setup-banner';
import { AdminSection } from '@/components/admin/admin-section';
import { ChartEmpty } from '@/components/shared/chart-empty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ArrowDown, TrendingDown } from 'lucide-react';
import type {
  AdminStatsActivationFunnel,
  AdminStatsActivationFunnelStep,
  AdminStatsPeriod,
} from '@/lib/types/admin';

interface AdminActivationFunnelProps {
  funnel?: AdminStatsActivationFunnel;
  period?: AdminStatsPeriod;
  isLoading: boolean;
  posthogConfigured: boolean;
  posthogFunnelError?: boolean;
}

interface FunnelStepDef {
  key: string;
  label: string;
  shortLabel: string;
  value: number;
  color: string;
}

interface FunnelStepMetrics extends FunnelStepDef {
  widthPct: number;
  stepConversion: number | null;
  stepDropOff: number | null;
  overallConversion: number | null;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--chart-1))',
] as const;

function stepToFunnelDef(step: AdminStatsActivationFunnelStep, index: number): FunnelStepDef {
  return {
    key: step.key,
    label: step.label,
    shortLabel: step.shortLabel,
    value: step.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  };
}

function withFunnelMetrics(steps: FunnelStepDef[]): FunnelStepMetrics[] {
  const top = steps[0]?.value ?? 0;

  return steps.map((step, index) => {
    const previous = index > 0 ? steps[index - 1].value : step.value;
    const widthPct = top > 0 ? (step.value / top) * 100 : 0;
    const stepConversion = index > 0 && previous > 0 ? (step.value / previous) * 100 : null;
    const stepDropOff = stepConversion !== null ? 100 - stepConversion : null;
    const overallConversion = top > 0 ? (step.value / top) * 100 : null;

    return {
      ...step,
      widthPct,
      stepConversion,
      stepDropOff,
      overallConversion,
    };
  });
}

function findBiggestDropOffIndex(metrics: FunnelStepMetrics[]): number | null {
  let maxDropOff = 0;
  let maxIndex: number | null = null;

  for (let index = 1; index < metrics.length; index++) {
    const dropOff = metrics[index].stepDropOff;
    if (dropOff !== null && dropOff > maxDropOff) {
      maxDropOff = dropOff;
      maxIndex = index;
    }
  }

  return maxIndex;
}

function FunnelLegend({ steps }: { steps: FunnelStepDef[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
      {steps.map((step) => (
        <div key={step.key} className="flex items-center gap-2 text-xs">
          <span
            className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15"
            style={{ backgroundColor: step.color }}
            aria-hidden
          />
          <span className="text-muted-foreground">{step.shortLabel}</span>
        </div>
      ))}
    </div>
  );
}

function FunnelConnector({
  stepConversion,
  stepDropOff,
  isBiggestDropOff,
}: {
  stepConversion: number | null;
  stepDropOff: number | null;
  isBiggestDropOff: boolean;
}) {
  if (stepConversion === null || stepDropOff === null) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative mx-auto flex w-full max-w-md flex-col items-center py-1',
        isBiggestDropOff && 'py-2',
      )}
      aria-hidden
    >
      <div className="flex h-5 w-px bg-border" />
      <ArrowDown className="-mt-0.5 size-3.5 text-muted-foreground" strokeWidth={2.5} />
      <div
        className={cn(
          'mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full px-3 py-1 text-xs',
          isBiggestDropOff
            ? 'border border-destructive/30 bg-destructive/10 text-destructive'
            : 'border border-border/60 bg-muted/40 text-foreground',
        )}
      >
        {isBiggestDropOff ? (
          <TrendingDown className="size-3 shrink-0" aria-hidden />
        ) : null}
        <span className="font-semibold text-success">{formatPercent(stepConversion, 0)} continue</span>
        <span className="text-muted-foreground">·</span>
        <span className={cn('font-medium', isBiggestDropOff ? 'text-destructive' : 'text-destructive/90')}>
          {formatPercent(stepDropOff, 0)} dropped
        </span>
        {isBiggestDropOff ? (
          <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Largest drop
          </span>
        ) : null}
      </div>
    </div>
  );
}

function FunnelStageBar({
  step,
  index,
  isBiggestDropOff,
}: {
  step: FunnelStepMetrics;
  index: number;
  isBiggestDropOff: boolean;
}) {
  const barWidth = Math.max(step.widthPct, index === 0 ? 100 : 22);

  return (
    <div className="flex w-full flex-col items-center">
      <div
        className={cn(
          'relative min-h-13 rounded-lg px-3 py-2.5 shadow-sm transition-[width] sm:min-h-14 sm:px-4',
          isBiggestDropOff && 'ring-2 ring-destructive/50 ring-offset-2 ring-offset-card',
        )}
        style={{
          width: `${barWidth}%`,
          minWidth: 'min(100%, 11rem)',
          backgroundColor: step.color,
        }}
        title={`${step.label}: ${formatNumber(step.value)}`}
      >
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p className="text-sm font-semibold leading-tight text-white drop-shadow-sm sm:text-[0.9375rem]">
            {step.label}
          </p>
          <p className="text-xl font-bold tabular-nums leading-none text-white drop-shadow-sm sm:text-2xl">
            {formatNumber(step.value)}
          </p>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium text-white/90 sm:text-xs">
          {index === 0 ? (
            <span>Top of funnel</span>
          ) : (
            <>
              <span>{formatPercent(step.stepConversion ?? 0, 0)} from previous</span>
              <span className="text-white/60">·</span>
              <span>{formatPercent(step.overallConversion ?? 0, 1)} of top</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivationFunnelChart({
  title,
  description,
  steps,
  isLoading,
  emptyMessage,
  footerNote,
}: {
  title: string;
  description: string;
  steps: FunnelStepDef[];
  isLoading: boolean;
  emptyMessage: string;
  footerNote?: string;
}) {
  const metrics = withFunnelMetrics(steps);
  const hasData = metrics.some((step) => step.value > 0);
  const top = metrics[0];
  const bottom = metrics.at(-1);
  const biggestDropOffIndex = findBiggestDropOffIndex(metrics);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
        {!isLoading && hasData ? (
          <>
            <p className="text-xs text-muted-foreground">
              Bar width reflects share of the top stage. Connectors show step-to-step retention; the
              highlighted connector marks the largest drop-off.
            </p>
            <FunnelLegend steps={steps} />
            {top && bottom && top.value > 0 ? (
              <p className="text-sm font-medium text-foreground">
                End-to-end: {formatNumber(bottom.value)} of {formatNumber(top.value)} (
                {formatPercent(bottom.overallConversion ?? 0, 1)})
              </p>
            ) : null}
          </>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[480px] w-full" aria-hidden />
        ) : hasData ? (
          <div className="mx-auto w-full max-w-lg space-y-0 px-1 sm:px-2">
            {metrics.map((step, index) => (
              <div key={step.key}>
                {index > 0 ? (
                  <FunnelConnector
                    stepConversion={step.stepConversion}
                    stepDropOff={step.stepDropOff}
                    isBiggestDropOff={index === biggestDropOffIndex}
                  />
                ) : null}
                <FunnelStageBar
                  step={step}
                  index={index}
                  isBiggestDropOff={index === biggestDropOffIndex}
                />
              </div>
            ))}
            {footerNote ? (
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{footerNote}</p>
            ) : null}
          </div>
        ) : (
          <ChartEmpty message={emptyMessage} height={480} />
        )}
      </CardContent>
    </Card>
  );
}

function PostHogFunnelEmptyState({
  posthogConfigured,
  posthogFunnelError,
}: {
  posthogConfigured: boolean;
  posthogFunnelError?: boolean;
}) {
  const message = !posthogConfigured
    ? 'Configure PostHog to view activation funnels.'
    : posthogFunnelError
      ? 'PostHog is configured but funnel data could not be loaded. Check API logs and your personal API key permissions.'
      : 'No activation funnel data yet.';

  return (
    <ChartEmpty
      message={message}
      height={480}
      action={
        !posthogConfigured ? (
          <div className="mt-2 max-w-md rounded-md border border-border/60 bg-muted/40 px-3 py-2 font-mono text-left text-[11px] leading-relaxed text-muted-foreground">
            <p>POSTHOG_PERSONAL_API_KEY=phx_...</p>
            <p>POSTHOG_PROJECT_ID=12345</p>
            <p>POSTHOG_HOST=https://eu.i.posthog.com</p>
          </div>
        ) : null
      }
    />
  );
}

export function AdminActivationFunnel({
  funnel,
  period = '30d',
  isLoading,
  posthogConfigured,
  posthogFunnelError,
}: AdminActivationFunnelProps) {
  const periodLabel = ADMIN_PERIOD_LABELS[period];
  const allTimeSteps = funnel?.steps?.map(stepToFunnelDef) ?? [];
  const periodSteps = funnel?.periodSteps?.map(stepToFunnelDef) ?? [];
  const hasFunnelData = allTimeSteps.some((step) => step.value > 0);
  const hasPeriodData = periodSteps.some((step) => step.value > 0);
  const showCharts =
    posthogConfigured && !posthogFunnelError && (hasFunnelData || hasPeriodData);

  return (
    <AdminSection
      title="Activation funnel"
      description="Ordered activation funnel from PostHog product events. Counts are unique users who completed each step in sequence within the conversion window."
      actions={showCharts ? <AdminPostHogPoweredBadge /> : null}
    >
      {!isLoading && !showCharts ? (
        <PostHogFunnelEmptyState
          posthogConfigured={posthogConfigured}
          posthogFunnelError={posthogFunnelError}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
          <ActivationFunnelChart
            title="All-time funnel"
            description="PostHog ordered funnel (10-year entry window, 90-day conversion window)."
            steps={allTimeSteps}
            isLoading={isLoading}
            emptyMessage="No activation funnel data yet."
          />
          <ActivationFunnelChart
            title={`${periodLabel} funnel`}
            description={`PostHog ordered funnel for users who entered in the last ${periodLabel.toLowerCase()}.`}
            steps={periodSteps}
            isLoading={isLoading}
            emptyMessage={`No activation funnel data in the last ${periodLabel.toLowerCase()}.`}
            footerNote="Unique users completing each step in order during the selected period. Pair with the weekly conversion chart above for rate trends."
          />
        </div>
      )}
    </AdminSection>
  );
}
