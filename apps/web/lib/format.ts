import { format, parseISO } from 'date-fns';

/** Format a number as USD currency. */
export function formatCurrency(
  value: number | null | undefined,
  opts: { compact?: boolean; signed?: boolean } = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const { compact, signed } = opts;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
    minimumFractionDigits: compact ? 0 : 2,
  }).format(Math.abs(value));
  const sign = value < 0 ? '-' : signed ? '+' : '';
  return `${sign}${formatted}`;
}

/** Format a plain number with thousands separators. */
export function formatNumber(value: number | null | undefined, fractionDigits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

/** Format a 0–100 percentage value. */
export function formatPercent(value: number | null | undefined, fractionDigits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(fractionDigits)}%`;
}

/** Format an R-multiple, e.g. "+1.8R". */
export function formatR(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}R`;
}

/** Format a profit factor (can be Infinity / null). */
export function formatProfitFactor(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (!Number.isFinite(value)) return '∞';
  return value.toFixed(2);
}

/** Tailwind text-color class for a P&L value (gain = success, loss = destructive). */
export function pnlColor(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return 'text-muted-foreground';
  return value > 0 ? 'text-success' : 'text-destructive';
}

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  try {
    return format(toDate(value), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  try {
    return format(toDate(value), 'MMM d, yyyy · HH:mm');
  } catch {
    return '—';
  }
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  try {
    return format(toDate(value), 'HH:mm');
  } catch {
    return '—';
  }
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return '—';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours < 24) return mins ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours ? `${days}d ${remHours}h` : `${days}d`;
}

/**
 * Compact duration from milliseconds, picking the two most significant units:
 * e.g. "422ms", "7s", "2m23s", "3h6m", "2d9h". Used for the log-scaled
 * trade-duration axis which spans sub-second to multi-day holds.
 */
export function formatDurationMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;

  const seconds = ms / 1000;
  if (seconds < 60) return `${Math.round(seconds)}s`;

  const minutes = seconds / 60;
  if (minutes < 60) {
    const m = Math.floor(minutes);
    const s = Math.round(seconds - m * 60);
    return s ? `${m}m${s}s` : `${m}m`;
  }

  const hours = minutes / 60;
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round(minutes - h * 60);
    return m ? `${h}h${m}m` : `${h}h`;
  }

  const days = hours / 24;
  const d = Math.floor(days);
  const h = Math.round(hours - d * 24);
  return h ? `${d}d${h}h` : `${d}d`;
}
