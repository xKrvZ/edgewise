'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/format';
import type { CalendarDay } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

interface CalendarHeatmapProps {
  data: CalendarDay[];
  initialMonth?: Date;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarHeatmap({ data, initialMonth }: CalendarHeatmapProps) {
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    for (const d of data) map.set(d.date.slice(0, 10), d);
    return map;
  }, [data]);

  const latest = useMemo(() => {
    if (initialMonth) return initialMonth;
    if (data.length === 0) return new Date();
    const max = data.reduce((acc, d) => (d.date > acc ? d.date : acc), data[0].date);
    return new Date(max);
  }, [data, initialMonth]);

  const [month, setMonth] = useState(() => startOfMonth(latest));

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const leadingBlanks = startOfMonth(month).getDay();

  const monthTotal = useMemo(() => {
    let total = 0;
    for (const day of days) {
      const entry = byDate.get(format(day, 'yyyy-MM-dd'));
      if (entry) total += entry.pnl;
    }
    return total;
  }, [days, byDate]);

  const maxAbs = useMemo(() => {
    let m = 1;
    for (const d of data) m = Math.max(m, Math.abs(d.pnl));
    return m;
  }, [data]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{format(month, 'MMMM yyyy')}</span>
          <span
            className={cn(
              'text-xs tabular-nums',
              monthTotal >= 0 ? 'text-success' : 'text-destructive',
            )}
          >
            {formatCurrency(monthTotal, { signed: true })}
          </span>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => setMonth((m) => subMonths(m, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed blanks.
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const entry = byDate.get(key);
          const pnl = entry?.pnl ?? 0;
          const intensity = entry ? Math.min(1, Math.abs(pnl) / maxAbs) : 0;
          const bg = !entry
            ? undefined
            : pnl >= 0
              ? `hsl(var(--success) / ${0.12 + intensity * 0.55})`
              : `hsl(var(--destructive) / ${0.12 + intensity * 0.55})`;
          const cell = (
            <div
              className={cn(
                'flex aspect-square flex-col items-center justify-center rounded-md border text-[11px] tabular-nums transition-colors',
                entry ? 'border-transparent' : 'border-border/60',
                !isSameMonth(day, month) && 'opacity-40',
              )}
              style={{ backgroundColor: bg }}
            >
              <span
                className={cn('font-medium', entry ? 'text-foreground' : 'text-muted-foreground')}
              >
                {format(day, 'd')}
              </span>
            </div>
          );

          if (!entry) return <div key={key}>{cell}</div>;
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>{cell}</TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p className="font-medium">{format(day, 'MMM d')}</p>
                  <p className={pnl >= 0 ? 'text-success' : 'text-destructive'}>
                    {formatCurrency(pnl, { signed: true })}
                  </p>
                  <p className="text-muted-foreground">
                    {entry.trades} trade{entry.trades === 1 ? '' : 's'} · {entry.winRate.toFixed(0)}
                    % win
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
