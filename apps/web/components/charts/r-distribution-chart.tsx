'use client';

import type { RDistributionBucket } from '@/lib/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface RDistributionChartProps {
  data: RDistributionBucket[];
  height?: number;
}

/** Bucket labels that represent losing R ranges are colored red. */
function bucketIsLoss(bucket: string): boolean {
  return bucket.trim().startsWith('-') || bucket.includes('<0');
}

export function RDistributionChart({ data, height = 280 }: RDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="bucket"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          width={32}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [Number(value), 'Trades'] as [number, string]}
        />
        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
          {data.map((d) => (
            <Cell
              key={d.bucket}
              fill={bucketIsLoss(d.bucket) ? 'hsl(var(--destructive))' : 'hsl(var(--success))'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
