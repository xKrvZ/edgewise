'use client';

import { Button } from '@/components/ui/button';
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

interface TradeCalendarProps {
  data: CalendarDay[];
  initialMonth?: Date;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Monthly P&L calendar: each in-month day shows its net P&L and trade count,
 * with a per-week summary column (net P&L + trading days). Richer than the
 * heatmap variant used elsewhere.
 */
export function TradeCalendar({ data, initialMonth }: TradeCalendarProps) {
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

      <div className="grid grid-cols-[repeat(7,1fr)_minmax(56px,0.8fr)] gap-1 text-center text-[10px] text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
        <div>Week</div>
      </div>

      <div className="mt-1 flex flex-col gap-1">
        {weeks.map((week) => {
          const weekKey = format(week[0], 'yyyy-MM-dd');
          let weekPnl = 0;
          let weekDays = 0;
          for (const day of week) {
            const entry = byDate.get(format(day, 'yyyy-MM-dd'));
            if (entry && isSameMonth(day, month)) {
              weekPnl += entry.pnl;
              weekDays += 1;
            }
          }
          return (
            <div key={weekKey} className="grid grid-cols-[repeat(7,1fr)_minmax(56px,0.8fr)] gap-1">
              {week.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const entry = byDate.get(key);
                const inMonth = isSameMonth(day, month);
                const pnl = entry?.pnl ?? 0;
                const has = !!entry && inMonth;
                return (
                  <div
                    key={key}
                    className={cn(
                      'flex aspect-square flex-col justify-between rounded-md border p-1 text-left',
                      !inMonth && 'opacity-30',
                      has && pnl >= 0 && 'border-transparent bg-success/15',
                      has && pnl < 0 && 'border-transparent bg-destructive/15',
                      !has && 'border-border/50',
                    )}
                  >
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {format(day, 'd')}
                    </span>
                    {has && (
                      <span className="flex flex-col">
                        <span
                          className={cn(
                            'text-[10px] font-semibold tabular-nums leading-tight',
                            pnl >= 0 ? 'text-success' : 'text-destructive',
                          )}
                        >
                          {formatCurrency(pnl, { compact: true, signed: true })}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{entry?.trades}t</span>
                      </span>
                    )}
                  </div>
                );
              })}
              <div className="flex aspect-square flex-col justify-center rounded-md border border-border/50 bg-muted/40 p-1 text-center">
                {weekDays > 0 ? (
                  <>
                    <span
                      className={cn(
                        'text-[10px] font-semibold tabular-nums leading-tight',
                        weekPnl >= 0 ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {formatCurrency(weekPnl, { compact: true, signed: true })}
                    </span>
                    <span className="text-[9px] text-muted-foreground">{weekDays}d</span>
                  </>
                ) : (
                  <span className="text-[10px] text-muted-foreground">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
