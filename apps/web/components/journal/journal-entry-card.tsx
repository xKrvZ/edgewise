'use client';

import { JournalLinkedTrades } from '@/components/journal/journal-linked-trades';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import type { JournalEntry } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export function JournalEntryCard({ entry, onEdit, onDelete }: JournalEntryCardProps) {
  const title = entry.title || format(new Date(entry.date), 'EEEE, MMM d');

  return (
    <Card
      className={cn(
        'group border-border bg-card',
        'transition-[border-color,box-shadow,transform] duration-150',
        'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md',
      )}
    >
      <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
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
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-4 whitespace-pre-wrap text-sm text-foreground/90">
          {entry.content}
        </p>
        <div className="mt-3 flex justify-end">
          <span className="flex items-center gap-0.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Read
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
