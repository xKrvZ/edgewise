'use client';

import { formatCurrency } from '@/lib/format';
import type { GroupStat } from '@/lib/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface GroupBarChartProps {
  data: GroupStat[];
  height?: number;
}

export function GroupBarChart({ data, height = 280 }: GroupBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
        />
        <YAxis
          type="category"
          dataKey="label"
          width={110}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [formatCurrency(Number(value)), 'Net P&L'] as [string, string]}
        />
        <ReferenceLine x={0} stroke="hsl(var(--border))" />
        <Bar dataKey="netPnl" radius={[0, 2, 2, 0]}>
          {data.map((d) => (
            <Cell
              key={d.key}
              fill={d.netPnl >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
