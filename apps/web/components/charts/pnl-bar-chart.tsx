'use client';

import { formatCurrency, formatDate } from '@/lib/format';
import type { PnlPoint } from '@/lib/types';
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

interface PnlBarChartProps {
  data: PnlPoint[];
  height?: number;
}

export function PnlBarChart({ data, height = 280 }: PnlBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => formatDate(v)}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          minTickGap={28}
        />
        <YAxis
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          width={56}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(v) => formatDate(v as string)}
          formatter={(value) => [formatCurrency(Number(value)), 'P&L'] as [string, string]}
        />
        <ReferenceLine y={0} stroke="hsl(var(--border))" />
        <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
          {data.map((d) => (
            <Cell
              key={d.date}
              fill={d.pnl >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
