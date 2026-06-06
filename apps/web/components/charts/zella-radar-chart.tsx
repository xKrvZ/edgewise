'use client';

import type { ZellaBreakdown } from '@/lib/types';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface ZellaRadarChartProps {
  breakdown: ZellaBreakdown;
  height?: number;
}

const DIMENSIONS: { key: keyof ZellaBreakdown; label: string }[] = [
  { key: 'winRate', label: 'Win %' },
  { key: 'profitFactor', label: 'Profit factor' },
  { key: 'avgWinLoss', label: 'Win/Loss' },
  { key: 'recoveryFactor', label: 'Recovery' },
  { key: 'maxDrawdown', label: 'Drawdown' },
  { key: 'consistency', label: 'Consistency' },
];

export function ZellaRadarChart({ breakdown, height = 240 }: ZellaRadarChartProps) {
  const data = DIMENSIONS.map((d) => ({
    dimension: d.label,
    score: breakdown[d.key],
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [`${Number(value).toFixed(0)}/100`, 'Score'] as [string, string]}
        />
        <Radar
          dataKey="score"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
