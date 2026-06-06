export function parsePeriodDays(period: '7d' | '30d' | '90d'): number {
  switch (period) {
    case '7d':
      return 7;
    case '90d':
      return 90;
    default:
      return 30;
  }
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function subDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function computeGrowthPercent(current: number, previous: number): number {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

export function sumSeriesAmounts<T extends { amount: number }>(
  series: T[],
  days: number,
): number {
  const slice = series.slice(-days);
  return Number(slice.reduce((sum, point) => sum + point.amount, 0).toFixed(2));
}

export function sumSeriesSliceAmounts<T extends { amount: number }>(
  series: T[],
  skipFromEnd: number,
  length: number,
): number {
  const end = Math.max(0, series.length - skipFromEnd);
  const start = Math.max(0, end - length);
  return Number(series.slice(start, end).reduce((sum, point) => sum + point.amount, 0).toFixed(2));
}

export function fillDailySeries(
  raw: { date: string; count: number }[],
  days: number,
): { date: string; count: number }[] {
  const map = new Map(raw.map((row) => [row.date, row.count]));
  const end = startOfDay(new Date());
  const series: { date: string; count: number }[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = toDateKey(subDays(end, offset));
    series.push({ date, count: map.get(date) ?? 0 });
  }

  return series;
}

export function fillDailyRevenueSeries(
  raw: { date: string; amount: number }[],
  days: number,
): { date: string; amount: number }[] {
  const map = new Map(raw.map((row) => [row.date, row.amount]));
  const end = startOfDay(new Date());
  const series: { date: string; amount: number }[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = toDateKey(subDays(end, offset));
    series.push({ date, amount: map.get(date) ?? 0 });
  }

  return series;
}
