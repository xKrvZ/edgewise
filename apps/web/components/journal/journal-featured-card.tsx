'use client';

import { JournalLinkedTrades } from '@/components/journal/journal-linked-trades';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import type { JournalEntry } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowRight, Pencil, Trash2 } from 'lucide-react';

interface JournalFeaturedCardProps {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export function JournalFeaturedCard({ entry, onEdit, onDelete }: JournalFeaturedCardProps) {
  const title = entry.title || format(new Date(entry.date), 'EEEE, MMM d');

  return (
    <div
      className={cn(
        'group mb-6 w-full rounded-lg border border-border bg-card text-left',
        'transition-[border-color,box-shadow,transform] duration-150',
        'hover:-translate-y-px hover:border-primary/45 hover:shadow-sm',
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-3">
            <span className="text-[11px] font-medium uppercase tracking-wide text-primary">
              Latest entry
            </span>

            <div className="space-y-1">
              <p className="truncate text-lg font-semibold tracking-tight text-foreground">
                {title}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(entry.date)}</span>
                {entry.mood && (
                  <Badge variant="secondary" className="font-normal">
                    {entry.mood}
                  </Badge>
                )}
                <JournalLinkedTrades trades={entry.trades ?? []} />
              </div>
            </div>

            <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground/90">
              {entry.content}
            </p>
          </div>

          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Edit entry" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive"
              aria-label="Delete entry"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <span className="flex items-center gap-1 text-sm font-medium text-primary opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            Continue reading
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
