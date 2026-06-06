'use client';

import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  className?: string;
  color?: string;
  width?: number;
  height?: number;
}

export function MiniSparkline({
  data,
  className,
  color = 'hsl(var(--primary))',
  width = 88,
  height = 40,
}: SparklineProps) {
  if (data.length < 2) {
    return <div className={cn('opacity-30', className)} style={{ width, height }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0', className)}
      width={width}
      height={height}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

interface MiniBarChartProps {
  data: number[];
  className?: string;
  color?: string;
  width?: number;
  height?: number;
}

export function MiniBarChart({
  data,
  className,
  color = 'hsl(var(--primary))',
  width = 56,
  height = 40,
}: MiniBarChartProps) {
  if (data.length === 0) {
    return <div className={cn('opacity-30', className)} style={{ width, height }} />;
  }

  const max = Math.max(...data, 1);
  const barWidth = (width - 4) / data.length - 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0', className)}
      width={width}
      height={height}
      aria-hidden
    >
      {data.map((value, index) => {
        const barHeight = (value / max) * (height - 4);
        const x = 2 + index * (barWidth + 2);
        const y = height - barHeight - 2;
        return (
          <rect
            key={`bar-${index}`}
            x={x}
            y={y}
            width={barWidth}
            height={Math.max(barHeight, 2)}
            rx={1}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

interface MiniProgressRingProps {
  value: number;
  className?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function MiniProgressRing({
  value,
  className,
  size = 44,
  strokeWidth = 5,
  color = 'hsl(var(--primary))',
}: MiniProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('shrink-0 -rotate-90', className)}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
