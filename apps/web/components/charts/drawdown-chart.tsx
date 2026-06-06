'use client';

import { formatCurrency, formatDate } from '@/lib/format';
import type { DrawdownPoint } from '@/lib/types';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DrawdownChartProps {
  data: DrawdownPoint[];
  height?: number;
}

/** Underwater chart: drawdown is a negative magnitude below the zero line. */
export function DrawdownChart({ data, height = 240 }: DrawdownChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="drawdownFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
            <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => formatDate(v)}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          minTickGap={32}
        />
        <YAxis
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          width={56}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(v) => formatDate(v as string)}
          formatter={(value) => [formatCurrency(Number(value)), 'Drawdown'] as [string, string]}
        />
        <Area
          type="monotone"
          dataKey="drawdown"
          stroke="hsl(var(--destructive))"
          strokeWidth={2}
          fill="url(#drawdownFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
