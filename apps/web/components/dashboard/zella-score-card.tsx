'use client';

import { ZellaRadarChart } from '@/components/charts/zella-radar-chart';
import type { ZellaBreakdown } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ZellaScoreCardProps {
  score: number;
  breakdown: ZellaBreakdown;
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-success';
  if (score >= 40) return 'text-warning';
  return 'text-destructive';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Elite';
  if (score >= 65) return 'Strong';
  if (score >= 45) return 'Developing';
  if (score >= 25) return 'Fragile';
  return 'Needs work';
}

export function ZellaScoreCard({ score, breakdown }: ZellaScoreCardProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <ZellaRadarChart breakdown={breakdown} />
      <div className="flex flex-col items-center">
        <span
          className={cn('text-3xl font-semibold tabular-nums tracking-tight', scoreColor(score))}
        >
          {score.toFixed(0)}
        </span>
        <span className="text-xs text-muted-foreground">Zella score · {scoreLabel(score)}</span>
      </div>
    </div>
  );
}
