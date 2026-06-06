'use client';

import { formatCurrency, formatDate } from '@/lib/format';
import type { EquityPoint } from '@/lib/types';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface EquityCurveChartProps {
  data: EquityPoint[];
  height?: number;
}

export function EquityCurveChart({ data, height = 280 }: EquityCurveChartProps) {
  const positive = data.length === 0 || data[data.length - 1].cumulativePnl >= 0;
  const stroke = positive ? 'hsl(var(--success))' : 'hsl(var(--destructive))';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
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
          formatter={(value) =>
            [formatCurrency(Number(value)), 'Cumulative P&L'] as [string, string]
          }
        />
        <Area
          type="monotone"
          dataKey="cumulativePnl"
          stroke={stroke}
          strokeWidth={2}
          fill="url(#equityFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
