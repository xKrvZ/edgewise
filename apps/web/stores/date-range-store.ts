import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DateRangePreset = '7d' | '30d' | '90d' | 'ytd' | 'all' | 'custom';

interface DateRangeState {
  preset: DateRangePreset;
  /** ISO date strings (inclusive). Null means unbounded. */
  from: string | null;
  to: string | null;
  setPreset: (preset: DateRangePreset) => void;
  setRange: (from: string | null, to: string | null) => void;
}

function rangeForPreset(preset: DateRangePreset): {
  from: string | null;
  to: string | null;
} {
  const now = new Date();
  const to = now.toISOString();
  const start = new Date(now);

  switch (preset) {
    case '7d':
      start.setDate(now.getDate() - 7);
      return { from: start.toISOString(), to };
    case '30d':
      start.setDate(now.getDate() - 30);
      return { from: start.toISOString(), to };
    case '90d':
      start.setDate(now.getDate() - 90);
      return { from: start.toISOString(), to };
    case 'ytd':
      return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to };
    default:
      return { from: null, to: null };
  }
}

export const useDateRangeStore = create<DateRangeState>()(
  persist(
    (set) => ({
      preset: '30d',
      ...rangeForPreset('30d'),
      setPreset: (preset) =>
        set(preset === 'custom' ? { preset } : { preset, ...rangeForPreset(preset) }),
      setRange: (from, to) => set({ preset: 'custom', from, to }),
    }),
    { name: 'edgewise.date-range' },
  ),
);
