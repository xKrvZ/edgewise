import type { CalendarDay, EquityPoint, PnlPoint } from '@/lib/types';
import { format, parseISO, subDays } from 'date-fns';

export type EquityTimeframe = '1D' | '1W' | '1M' | '3M' | 'ALL';

const TIMEFRAME_DAYS: Record<Exclude<EquityTimeframe, 'ALL'>, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
};

export function filterEquityByTimeframe(
  data: EquityPoint[],
  timeframe: EquityTimeframe,
): EquityPoint[] {
  if (timeframe === 'ALL' || data.length === 0) return data;
  const days = TIMEFRAME_DAYS[timeframe];
  const lastDate = parseISO(data[data.length - 1].date);
  const cutoff = subDays(lastDate, days);
  return data.filter((point) => parseISO(point.date) >= cutoff);
}

export function computePercentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return current > 0 ? 100 : -100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function splitByHalf<T>(items: T[]): { first: T[]; second: T[] } {
  if (items.length < 2) return { first: items, second: [] };
  const mid = Math.floor(items.length / 2);
  return { first: items.slice(0, mid), second: items.slice(mid) };
}

export function aggregateCalendarWinRate(days: CalendarDay[]): number | null {
  const totalTrades = days.reduce((sum, day) => sum + day.trades, 0);
  if (totalTrades === 0) return null;
  const weighted = days.reduce((sum, day) => sum + day.winRate * day.trades, 0);
  return weighted / totalTrades;
}

export function aggregateCalendarTrades(days: CalendarDay[]): number {
  return days.reduce((sum, day) => sum + day.trades, 0);
}

export function profitFactorFromPnl(days: PnlPoint[]): number | null {
  let grossProfit = 0;
  let grossLoss = 0;
  for (const day of days) {
    if (day.pnl > 0) grossProfit += day.pnl;
    else grossLoss += Math.abs(day.pnl);
  }
  if (grossLoss === 0) return grossProfit > 0 ? null : 0;
  return grossProfit / grossLoss;
}

export interface MonthlyPnlPoint {
  month: string;
  label: string;
  pnl: number;
}

export function aggregateMonthlyPnl(data: PnlPoint[]): MonthlyPnlPoint[] {
  const byMonth = new Map<string, number>();
  for (const point of data) {
    const month = format(parseISO(point.date), 'yyyy-MM');
    byMonth.set(month, (byMonth.get(month) ?? 0) + point.pnl);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, pnl]) => ({
      month,
      label: format(parseISO(`${month}-01`), "MMM ''yy"),
      pnl,
    }));
}

export function sparklineValues(data: number[], maxPoints = 12): number[] {
  if (data.length <= maxPoints) return data;
  const step = data.length / maxPoints;
  const result: number[] = [];
  for (let i = 0; i < maxPoints; i++) {
    result.push(data[Math.floor(i * step)]);
  }
  return result;
}
