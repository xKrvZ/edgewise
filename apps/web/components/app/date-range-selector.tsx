'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type DateRangePreset, useDateRangeStore } from '@/stores/date-range-store';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

const PRESET_LABELS: Record<Exclude<DateRangePreset, 'custom'>, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  ytd: 'Year to date',
  all: 'All time',
};

interface DateRangeSelectorProps {
  /** Popover alignment relative to the calendar trigger. */
  calendarAlign?: 'start' | 'end';
}

export function DateRangeSelector({ calendarAlign = 'start' }: DateRangeSelectorProps) {
  const { preset, from, to, setPreset, setRange } = useDateRangeStore();
  const [open, setOpen] = useState(false);

  const selectedRange: DateRange | undefined = from
    ? { from: new Date(from), to: to ? new Date(to) : undefined }
    : undefined;

  return (
    <div className="flex items-center gap-2">
      <Select value={preset} onValueChange={(value) => setPreset(value as DateRangePreset)}>
        <SelectTrigger className="h-9 w-[150px]" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PRESET_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <CalendarIcon className="h-4 w-4" />
            {preset === 'custom' && from
              ? `${format(new Date(from), 'MMM d')}${
                  to ? ` – ${format(new Date(to), 'MMM d')}` : ''
                }`
              : 'Custom'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={calendarAlign}>
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={selectedRange}
            onSelect={(range) =>
              setRange(
                range?.from ? range.from.toISOString() : null,
                range?.to ? range.to.toISOString() : null,
              )
            }
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
