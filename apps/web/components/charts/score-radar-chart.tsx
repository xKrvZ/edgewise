'use client';

import type { TraderScoreBreakdown } from '@/lib/types';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface ScoreRadarChartProps {
  breakdown: TraderScoreBreakdown;
  height?: number;
}

const DIMENSIONS: { key: keyof TraderScoreBreakdown; label: string }[] = [
  { key: 'winRate', label: 'Win rate' },
  { key: 'profitFactor', label: 'Profit factor' },
  { key: 'avgWinLoss', label: 'Avg win/loss' },
  { key: 'recoveryFactor', label: 'Recovery' },
  { key: 'maxDrawdown', label: 'Drawdown' },
  { key: 'consistency', label: 'Consistency' },
];

export function ScoreRadarChart({ breakdown, height = 240 }: ScoreRadarChartProps) {
  const data = DIMENSIONS.map(({ key, label }) => ({
    dimension: label,
    score: breakdown[key],
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%" aria-hidden>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
          tickCount={5}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [`${Number(value).toFixed(0)}`, 'Score'] as [string, string]}
        />
        <Radar
          dataKey="score"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
