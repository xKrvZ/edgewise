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
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
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

  const weeks = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month));
    const gridEnd = endOfWeek(endOfMonth(month));
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
    const chunked: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      chunked.push(days.slice(i, i + 7));
    }
    return chunked;
  }, [month]);

  const monthTotal = useMemo(() => {
    let total = 0;
    for (const week of weeks) {
      for (const day of week) {
        if (!isSameMonth(day, month)) continue;
        const entry = byDate.get(format(day, 'yyyy-MM-dd'));
        if (entry) total += entry.pnl;
      }
    }
    return total;
  }, [weeks, byDate, month]);

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

      <div className="mt-1 flex flex-col gap-1">
        {weeks.map((week) => {
          const weekKey = format(week[0], 'yyyy-MM-dd');
          let weekPnl = 0;
          let weekHasData = false;
          for (const day of week) {
            const entry = byDate.get(format(day, 'yyyy-MM-dd'));
            if (entry) {
              weekPnl += entry.pnl;
              weekHasData = true;
            }
          }

          return (
            <div key={weekKey} className="grid grid-cols-7 gap-1">
              {week.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const entry = byDate.get(key);
                const inMonth = isSameMonth(day, month);
                const isSaturday = day.getDay() === 6;
                const pnl = entry?.pnl ?? 0;
                const hasDaily = !!entry && inMonth;
                const intensity = hasDaily ? Math.min(1, Math.abs(pnl) / maxAbs) : 0;
                const bg =
                  !hasDaily || !entry
                    ? undefined
                    : pnl >= 0
                      ? `hsl(var(--success) / ${0.12 + intensity * 0.55})`
                      : `hsl(var(--destructive) / ${0.12 + intensity * 0.55})`;

                const cell = (
                  <div
                    className={cn(
                      'flex aspect-square min-h-0 flex-col items-center justify-center gap-px rounded-md border p-0.5 text-[11px] tabular-nums transition-colors',
                      hasDaily ? 'border-transparent' : 'border-border/60',
                      !inMonth && 'opacity-40',
                    )}
                    style={{ backgroundColor: bg }}
                  >
                    <span
                      className={cn(
                        'text-[10px] font-medium leading-none',
                        hasDaily || (isSaturday && weekHasData) ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {isSaturday && weekHasData && (
                      <span
                        className={cn(
                          'max-w-full truncate text-[8px] font-medium leading-none sm:text-[9px]',
                          weekPnl >= 0 ? 'text-success/80' : 'text-destructive/80',
                        )}
                        title="Week total"
                      >
                        W {formatCurrency(weekPnl, { compact: true, signed: true })}
                      </span>
                    )}
                    {hasDaily && (
                      <span
                        className={cn(
                          'max-w-full truncate text-[9px] font-semibold leading-none sm:text-[10px]',
                          pnl >= 0 ? 'text-success' : 'text-destructive',
                        )}
                      >
                        {formatCurrency(pnl, { compact: true, signed: true })}
                      </span>
                    )}
                  </div>
                );

                const showTooltip = hasDaily || (isSaturday && weekHasData);
                if (!showTooltip) {
                  return <div key={key}>{cell}</div>;
                }

                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>{cell}</TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <p className="font-medium">{format(day, 'MMM d')}</p>
                        {isSaturday && weekHasData && (
                          <p className={weekPnl >= 0 ? 'text-success' : 'text-destructive'}>
                            Week: {formatCurrency(weekPnl, { signed: true })}
                          </p>
                        )}
                        {hasDaily && entry && (
                          <>
                            <p className={pnl >= 0 ? 'text-success' : 'text-destructive'}>
                              Day: {formatCurrency(pnl, { signed: true })}
                            </p>
                            <p className="text-muted-foreground">
                              {entry.trades} trade{entry.trades === 1 ? '' : 's'} ·{' '}
                              {entry.winRate.toFixed(0)}% win
                            </p>
                          </>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
