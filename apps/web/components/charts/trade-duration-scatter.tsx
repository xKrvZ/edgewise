'use client';

import { formatCurrency, formatDurationMs } from '@/lib/format';
import type { TradeDurationPoint } from '@/lib/types';
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

interface TradeDurationScatterProps {
  data: TradeDurationPoint[];
  height?: number;
}

/** Floor used so zero/sub-millisecond holds still plot on the log axis. */
const MIN_MS = 1;

/** Geometric (log-spaced) ticks spanning [min, max], inclusive of both ends. */
function logTicks(min: number, max: number, count = 8): number[] {
  if (!(max > min)) return [min];
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const step = (logMax - logMin) / (count - 1);
  return Array.from({ length: count }, (_, i) => 10 ** (logMin + step * i));
}

/**
 * Scatter of hold duration (x, log-scaled milliseconds) vs realized P&L (y),
 * colored by win. The log axis spreads holds that range from milliseconds to
 * days, mirroring a "trade duration performance" view.
 */
export function TradeDurationScatter({ data, height = 240 }: TradeDurationScatterProps) {
  // Clamp to the floor so zero-duration trades remain plottable on a log scale.
  const points = data.map((d) => ({
    ...d,
    x: Math.max(MIN_MS, d.durationMs),
  }));

  const xs = points.map((p) => p.x);
  const min = xs.length > 0 ? Math.min(...xs) : MIN_MS;
  // Guarantee a non-degenerate domain when all holds are (near) identical.
  const max = xs.length > 0 ? Math.max(...xs) : MIN_MS;
  const domainMax = max > min ? max : min * 10;
  const ticks = logTicks(min, domainMax);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          dataKey="x"
          name="Duration"
          scale="log"
          domain={[min, domainMax]}
          ticks={ticks}
          allowDataOverflow
          tickFormatter={(v) => formatDurationMs(Number(v))}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
        />
        <YAxis
          type="number"
          dataKey="pnl"
          name="P&L"
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          width={56}
        />
        <ZAxis range={[36, 36]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--border))' }}
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value, name, item) =>
            name === 'Duration'
              ? [formatDurationMs(Number(item?.payload?.durationMs)), 'Duration']
              : [formatCurrency(Number(value)), 'P&L']
          }
        />
        <Scatter data={points} fillOpacity={0.7}>
          {points.map((d, i) => (
            <Cell
              // biome-ignore lint/suspicious/noArrayIndexKey: scatter points have no stable id.
              key={i}
              fill={d.win ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
