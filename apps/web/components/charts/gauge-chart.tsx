'use client';

import { cn } from '@/lib/utils';
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

interface GaugeChartProps {
  /** Fill amount as a percentage (0-100). */
  value: number;
  /** Large centered text, e.g. "62%" or "1.84". */
  displayValue: string;
  /** Small caption under the value. */
  caption?: string;
  color?: string;
  height?: number;
  valueClassName?: string;
}

/**
 * Donut-style gauge built on recharts' RadialBarChart. `value` drives the arc
 * fill (clamped 0-100); the formatted figure is rendered in the center.
 */
export function GaugeChart({
  value,
  displayValue,
  caption,
  color = 'hsl(var(--primary))',
  height = 160,
  valueClassName,
}: GaugeChartProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const data = [{ name: 'value', value: clamped, fill: color }];

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          innerRadius="72%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          barSize={12}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: 'hsl(var(--muted))' }}
            dataKey="value"
            cornerRadius={8}
            angleAxisId={0}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-semibold tabular-nums tracking-tight', valueClassName)}>
          {displayValue}
        </span>
        {caption && <span className="text-xs text-muted-foreground">{caption}</span>}
      </div>
    </div>
  );
}
