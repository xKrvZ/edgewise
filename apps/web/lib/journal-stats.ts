import type { JournalEntry } from '@/lib/types';
import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';

export interface JournalListSummary {
  total: number;
  mostRecent: JournalEntry | null;
  streak: number;
}

export function summarizeJournalEntries(entries: JournalEntry[]): JournalListSummary {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return {
    total: entries.length,
    mostRecent: sorted[0] ?? null,
    streak: computeStreak(sorted),
  };
}

function computeStreak(sortedEntries: JournalEntry[]): number {
  if (sortedEntries.length === 0) return 0;

  const uniqueDates = [
    ...new Set(sortedEntries.map((e) => startOfDay(parseISO(e.date)).toISOString())),
  ]
    .map((d) => parseISO(d))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = startOfDay(new Date());
  const mostRecent = uniqueDates[0];
  const daysSinceMostRecent = differenceInCalendarDays(today, mostRecent);

  if (daysSinceMostRecent > 1) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const gap = differenceInCalendarDays(uniqueDates[i - 1], uniqueDates[i]);
    if (gap === 1) streak += 1;
    else break;
  }

  return streak;
}
