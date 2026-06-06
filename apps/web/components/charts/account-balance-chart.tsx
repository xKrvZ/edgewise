'use client';

import { formatCurrency, formatDate } from '@/lib/format';
import type { AccountBalancePoint } from '@/lib/types';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AccountBalanceChartProps {
  data: AccountBalancePoint[];
  height?: number;
}

export function AccountBalanceChart({ data, height = 240 }: AccountBalanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          domain={['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(v) => formatDate(v as string)}
          formatter={(value) => [formatCurrency(Number(value)), 'Balance'] as [string, string]}
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="hsl(var(--success))"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
