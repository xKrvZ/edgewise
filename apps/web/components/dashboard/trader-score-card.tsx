'use client';

import { ScoreRadarChart } from '@/components/charts/score-radar-chart';
import type { TraderScoreBreakdown } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TraderScoreCardProps {
  score: number;
  breakdown: TraderScoreBreakdown;
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

export function TraderScoreCard({ score, breakdown }: TraderScoreCardProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <ScoreRadarChart breakdown={breakdown} />
      <div className="flex flex-col items-center">
        <span
          className={cn('text-3xl font-semibold tabular-nums tracking-tight', scoreColor(score))}
        >
          {score.toFixed(0)}
        </span>
        <span className="text-xs text-muted-foreground">Trader score · {scoreLabel(score)}</span>
      </div>
    </div>
  );
}
