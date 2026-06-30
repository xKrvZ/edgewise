import type { Selectable } from 'kysely';
import type { TradingSession } from '@/database/types/db';

/** Parse HH:mm or HH:mm:ss into minutes since midnight. */
export function parseTimeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  const seconds = parts[2] ?? 0;
  return hours * 60 + minutes + seconds / 60;
}

/** Local clock time in `timezone` as minutes since midnight. */
export function getLocalTimeMinutes(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  let hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const second = Number(parts.find((p) => p.type === 'second')?.value ?? 0);
  if (hour === 24) hour = 0;
  return hour * 60 + minute + second / 60;
}

export function isTimeInSession(
  localMinutes: number,
  startMinutes: number,
  endMinutes: number,
): boolean {
  if (startMinutes <= endMinutes) {
    return localMinutes >= startMinutes && localMinutes < endMinutes;
  }
  return localMinutes >= startMinutes || localMinutes < endMinutes;
}

export function resolveTradingSessionId(
  sessions: Selectable<TradingSession>[],
  timestamp: Date,
  userTimezone?: string,
): string | null {
  for (const session of sessions) {
    const tz = session.timezone ?? userTimezone ?? 'UTC';
    try {
      const localMinutes = getLocalTimeMinutes(timestamp, tz);
      const start = parseTimeToMinutes(session.startTime);
      const end = parseTimeToMinutes(session.endTime);
      if (isTimeInSession(localMinutes, start, end)) {
        return session.id;
      }
    } catch {
      continue;
    }
  }
  return null;
}
