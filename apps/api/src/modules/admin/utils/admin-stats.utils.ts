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

export function startOfCalendarMonth(date: Date): Date {
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function sumSeriesCounts<T extends { count: number }>(series: T[]): number {
  return series.reduce((sum, point) => sum + point.count, 0);
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

export interface AdminMetricsSeriesPoint {
  date: string;
  signups: number;
  subscriptions: number;
  cancellations: number;
  trades: number;
  journals: number;
  communityJoins: number;
  revenue: number;
}

export function mergeDailyMetricsSeries(
  periodDays: number,
  signups: { date: string; count: number }[],
  subscriptions: { date: string; count: number }[],
  cancellations: { date: string; count: number }[],
  trades: { date: string; count: number }[],
  journals: { date: string; count: number }[],
  communityJoins: { date: string; count: number }[],
  revenue: { date: string; amount: number }[],
): AdminMetricsSeriesPoint[] {
  const signupMap = new Map(signups.map((row) => [row.date, row.count]));
  const subscriptionMap = new Map(subscriptions.map((row) => [row.date, row.count]));
  const cancellationMap = new Map(cancellations.map((row) => [row.date, row.count]));
  const tradeMap = new Map(trades.map((row) => [row.date, row.count]));
  const journalMap = new Map(journals.map((row) => [row.date, row.count]));
  const communityJoinMap = new Map(communityJoins.map((row) => [row.date, row.count]));
  const revenueMap = new Map(revenue.map((row) => [row.date, row.amount]));
  const end = startOfDay(new Date());
  const series: AdminMetricsSeriesPoint[] = [];

  for (let offset = periodDays - 1; offset >= 0; offset -= 1) {
    const date = toDateKey(subDays(end, offset));
    series.push({
      date,
      signups: signupMap.get(date) ?? 0,
      subscriptions: subscriptionMap.get(date) ?? 0,
      cancellations: cancellationMap.get(date) ?? 0,
      trades: tradeMap.get(date) ?? 0,
      journals: journalMap.get(date) ?? 0,
      communityJoins: communityJoinMap.get(date) ?? 0,
      revenue: revenueMap.get(date) ?? 0,
    });
  }

  return series;
}

export interface AdminActivationTrendPoint {
  weekStart: string;
  signups: number;
  journalsCreated: number;
  firstTrades: number;
  communityJoins: number;
  subscriptions: number;
  journalRate: number;
  tradeRate: number;
  communityRate: number;
  subscriptionRate: number;
}

function sumCountsInRange(
  series: { date: string; count: number }[],
  start: Date,
  end: Date,
): number {
  const startKey = toDateKey(start);
  const endKey = toDateKey(end);
  return series.reduce((sum, point) => {
    if (point.date >= startKey && point.date <= endKey) {
      return sum + point.count;
    }
    return sum;
  }, 0);
}

export function buildWeeklyActivationTrend(
  periodDays: number,
  signups: { date: string; count: number }[],
  journals: { date: string; count: number }[],
  firstTrades: { date: string; count: number }[],
  communityJoins: { date: string; count: number }[],
  subscriptions: { date: string; count: number }[],
): AdminActivationTrendPoint[] {
  const end = startOfDay(new Date());
  const start = subDays(end, periodDays - 1);
  const weeks: AdminActivationTrendPoint[] = [];

  let weekStart = startOfDay(start);
  while (weekStart <= end) {
    const weekEndInclusive = startOfDay(subDays(weekStart, -6));
    const boundedEnd = weekEndInclusive > end ? end : weekEndInclusive;

    const weekSignups = sumCountsInRange(signups, weekStart, boundedEnd);
    const weekJournals = sumCountsInRange(journals, weekStart, boundedEnd);
    const weekFirstTrades = sumCountsInRange(firstTrades, weekStart, boundedEnd);
    const weekCommunityJoins = sumCountsInRange(communityJoins, weekStart, boundedEnd);
    const weekSubscriptions = sumCountsInRange(subscriptions, weekStart, boundedEnd);

    weeks.push({
      weekStart: toDateKey(weekStart),
      signups: weekSignups,
      journalsCreated: weekJournals,
      firstTrades: weekFirstTrades,
      communityJoins: weekCommunityJoins,
      subscriptions: weekSubscriptions,
      journalRate:
        weekSignups > 0 ? Number(((weekJournals / weekSignups) * 100).toFixed(1)) : 0,
      tradeRate:
        weekSignups > 0 ? Number(((weekFirstTrades / weekSignups) * 100).toFixed(1)) : 0,
      communityRate:
        weekSignups > 0 ? Number(((weekCommunityJoins / weekSignups) * 100).toFixed(1)) : 0,
      subscriptionRate:
        weekSignups > 0 ? Number(((weekSubscriptions / weekSignups) * 100).toFixed(1)) : 0,
    });

    weekStart = startOfDay(subDays(weekStart, -7));
  }

  return weeks;
}
