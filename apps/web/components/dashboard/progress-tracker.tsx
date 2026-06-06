'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatDate, pnlColor } from '@/lib/format';
import type { CalendarDay } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  isSameMonth,
  startOfDay,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { useMemo } from 'react';

interface ProgressTrackerProps {
  /** Daily trading calendar entries (any order). */
  data: CalendarDay[];
  /** Profitable-day rate for the filtered period (0–1). */
  greenDayRate: number;
}

const WEEKS_TO_SHOW = 52;
const CELL_SIZE_PX = 11;
const CELL_GAP_PX = 3;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const VISIBLE_DAY_LABELS = new Set(['Mon', 'Wed', 'Fri']);

/** GitHub-style footprint: fixed cells, no stretch on wide viewports. */
const HEATMAP_MAX_WIDTH_PX =
  28 + // day-of-week labels
  6 + // label column gap
  12 + // grid padding (p-1.5 × 2)
  2 + // grid border
  WEEKS_TO_SHOW * CELL_SIZE_PX +
  (WEEKS_TO_SHOW - 1) * CELL_GAP_PX;

interface DayCell {
  date: Date;
  dateKey: string;
  entry?: CalendarDay;
  isFuture: boolean;
}

interface WeekColumn {
  weekStart: Date;
  days: DayCell[];
}

function cellBackground(pnl: number, maxAbs: number): string {
  const intensity = Math.min(1, Math.abs(pnl) / maxAbs);
  const alpha = 0.18 + intensity * 0.62;
  return pnl >= 0
    ? `hsl(var(--success) / ${alpha})`
    : `hsl(var(--destructive) / ${alpha})`;
}

function buildGrid(data: CalendarDay[]) {
  const byDate = new Map<string, CalendarDay>();
  for (const d of data) byDate.set(d.date.slice(0, 10), d);

  const today = startOfDay(new Date());
  const gridEnd = endOfWeek(today, { weekStartsOn: 0 });
  const gridStart = startOfWeek(subWeeks(gridEnd, WEEKS_TO_SHOW - 1), { weekStartsOn: 0 });

  let maxAbs = 1;
  for (const d of data) maxAbs = Math.max(maxAbs, Math.abs(d.pnl));

  const weeks: WeekColumn[] = [];
  let cursor = gridStart;

  while (cursor <= gridEnd) {
    const days: DayCell[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(cursor, i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const isFuture = date > today;
      days.push({
        date,
        dateKey,
        entry: isFuture ? undefined : byDate.get(dateKey),
        isFuture,
      });
    }
    weeks.push({ weekStart: cursor, days });
    cursor = addWeeks(cursor, 1);
  }

  const monthLabels = weeks.map((week) => {
    const firstOfMonth = week.days.find((d) => d.date.getDate() === 1 && !d.isFuture);
    return firstOfMonth ? format(firstOfMonth.date, 'MMM') : null;
  });

  return { weeks, monthLabels, maxAbs };
}

/**
 * GitHub-style contribution heatmap of trading days: each cell encodes daily
 * P&L intensity (green profit, red loss, muted empty). Last 52 weeks, oldest
 * left → newest right.
 */
export function ProgressTracker({ data, greenDayRate }: ProgressTrackerProps) {
  const today = startOfDay(new Date());
  const { weeks, monthLabels, maxAbs } = useMemo(() => buildGrid(data), [data]);

  const stats = useMemo(() => {
    let tradingDays = 0;
    let greenDays = 0;
    let greenDaysThisMonth = 0;

    for (const d of data) {
      const date = startOfDay(new Date(d.date.slice(0, 10)));
      if (date > today) continue;
      tradingDays += 1;
      if (d.pnl > 0) {
        greenDays += 1;
        if (isSameMonth(date, today)) greenDaysThisMonth += 1;
      }
    }

    return { tradingDays, greenDays, greenDaysThisMonth };
  }, [data, today]);

  const greenPct = Math.round(greenDayRate * 100);

  if (data.length === 0) {
    return (
      <div className="flex h-[120px] items-center justify-center text-sm text-muted-foreground">
        No trading activity in this period.
      </div>
    );
  }

  return (
    <div
      className="flex w-fit max-w-full flex-col gap-3"
      style={{ maxWidth: HEATMAP_MAX_WIDTH_PX }}
    >
      <div className="max-w-full overflow-x-auto pb-1 scrollbar-thin [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
        <div className="inline-flex w-fit min-w-0 gap-1.5">
          {/* Day-of-week labels */}
          <div
            className="flex shrink-0 flex-col justify-end pr-0.5 pt-5"
            style={{ gap: CELL_GAP_PX }}
          >
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className={cn(
                  'flex items-center text-[10px] leading-none text-muted-foreground',
                  !VISIBLE_DAY_LABELS.has(label) && 'opacity-0',
                )}
                style={{ height: CELL_SIZE_PX }}
                aria-hidden={!VISIBLE_DAY_LABELS.has(label)}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex flex-col gap-1">
            {/* Month labels */}
            <div className="flex pl-0.5" style={{ gap: CELL_GAP_PX }}>
              {weeks.map((week, i) => (
                <div
                  key={format(week.weekStart, 'yyyy-MM-dd')}
                  className="shrink-0 text-[10px] leading-none text-muted-foreground"
                  style={{ width: CELL_SIZE_PX }}
                >
                  {monthLabels[i]}
                </div>
              ))}
            </div>

            {/* Cell grid */}
            <div
              className="flex rounded-md border border-border/50 bg-muted/20 p-1.5"
              style={{ gap: CELL_GAP_PX }}
            >
              {weeks.map((week) => (
                <div
                  key={format(week.weekStart, 'yyyy-MM-dd')}
                  className="flex flex-col"
                  style={{ gap: CELL_GAP_PX }}
                >
                  {week.days.map((cell) => {
                    const { entry, isFuture } = cell;
                    const hasTrade = !!entry;
                    const pnl = entry?.pnl ?? 0;
                    const flat = hasTrade && pnl === 0;

                    const ariaLabel = isFuture
                      ? `${formatDate(cell.dateKey)}: no data`
                      : hasTrade
                        ? `${formatDate(cell.dateKey)}: ${formatCurrency(pnl, { signed: true })}, ${entry.trades} trade${entry.trades === 1 ? '' : 's'}`
                        : `${formatDate(cell.dateKey)}: no trades`;

                    const square = (
                      <div
                        role="img"
                        aria-label={ariaLabel}
                        tabIndex={hasTrade ? 0 : undefined}
                        className={cn(
                          'shrink-0 rounded-[2px] outline-none transition-[transform,box-shadow] duration-150',
                          'focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                          hasTrade && 'hover:scale-125 hover:ring-1 hover:ring-border/80',
                          isFuture && 'bg-transparent',
                          !isFuture && !hasTrade && 'bg-muted/60',
                          flat && 'bg-muted-foreground/25',
                        )}
                        style={{
                          width: CELL_SIZE_PX,
                          height: CELL_SIZE_PX,
                          ...(hasTrade && !flat
                            ? { backgroundColor: cellBackground(pnl, maxAbs) }
                            : {}),
                        }}
                      />
                    );

                    if (!hasTrade || isFuture) {
                      return <div key={cell.dateKey}>{square}</div>;
                    }

                    return (
                      <Tooltip key={cell.dateKey}>
                        <TooltipTrigger asChild>{square}</TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6}>
                          <div className="text-xs">
                            <p className="font-medium">{formatDate(cell.dateKey)}</p>
                            <p className={pnlColor(pnl)}>
                              {formatCurrency(pnl, { signed: true })}
                            </p>
                            <p className="text-muted-foreground">
                              {entry.trades} trade{entry.trades === 1 ? '' : 's'}
                              {entry.winRate > 0 && (
                                <>
                                  {' '}
                                  · {Math.round(entry.winRate * 100)}% win
                                </>
                              )}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span>Loss</span>
          <div className="flex" style={{ gap: CELL_GAP_PX }}>
            {[0.22, 0.42, 0.62, 0.82].map((alpha) => (
              <div
                key={`loss-${alpha}`}
                className="rounded-[2px]"
                style={{
                  width: CELL_SIZE_PX,
                  height: CELL_SIZE_PX,
                  backgroundColor: `hsl(var(--destructive) / ${alpha})`,
                }}
              />
            ))}
          </div>
          <div
            className="rounded-[2px] bg-muted/60"
            style={{ width: CELL_SIZE_PX, height: CELL_SIZE_PX }}
          />
          <div className="flex" style={{ gap: CELL_GAP_PX }}>
            {[0.22, 0.42, 0.62, 0.82].map((alpha) => (
              <div
                key={`gain-${alpha}`}
                className="rounded-[2px]"
                style={{
                  width: CELL_SIZE_PX,
                  height: CELL_SIZE_PX,
                  backgroundColor: `hsl(var(--success) / ${alpha})`,
                }}
              />
            ))}
          </div>
          <span>Profit</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground tabular-nums">{greenPct}%</span> green days
        </span>
        <span className="text-border">·</span>
        <span>
          <span className="font-medium text-foreground tabular-nums">
            {stats.greenDaysThisMonth}
          </span>{' '}
          profitable day{stats.greenDaysThisMonth === 1 ? '' : 's'} this month
        </span>
        <span className="text-border">·</span>
        <span>
          <span className="font-medium text-foreground tabular-nums">{stats.tradingDays}</span>{' '}
          trading day{stats.tradingDays === 1 ? '' : 's'} in period
        </span>
      </div>
    </div>
  );
}
