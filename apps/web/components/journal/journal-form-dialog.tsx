'use client';

import { JournalTradePicker } from '@/components/journal/journal-trade-picker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, api } from '@/lib/api-client';
import { JOURNAL_TEMPLATES } from '@/lib/journal-templates';
import type { CreateJournalEntryInput, JournalEntry, UpdateJournalEntryInput } from '@/lib/types';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const MOODS = [
  'Confident',
  'Calm',
  'Focused',
  'Neutral',
  'Anxious',
  'Frustrated',
  'Greedy',
  'Fearful',
];

const NONE = '__none__';

interface JournalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: JournalEntry;
  defaultDate?: string;
  onSaved?: () => void;
}

export function JournalFormDialog({
  open,
  onOpenChange,
  entry,
  defaultDate,
  onSaved,
}: JournalFormDialogProps) {
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState('');
  const [content, setContent] = useState('');
  const [tradeIds, setTradeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(entry?.date?.slice(0, 10) ?? defaultDate ?? format(new Date(), 'yyyy-MM-dd'));
    setTitle(entry?.title ?? '');
    setMood(entry?.mood ?? '');
    setContent(entry?.content ?? '');
    setTradeIds(entry?.tradeIds ?? []);
  }, [open, entry, defaultDate]);

  async function handleSubmit() {
    if (!content.trim()) {
      toast.error('Write something first');
      return;
    }
    setSaving(true);
    try {
      if (entry) {
        const payload: UpdateJournalEntryInput = {
          date: new Date(date).toISOString(),
          title: title.trim() || undefined,
          mood: mood || undefined,
          content: content.trim(),
          tradeIds,
        };
        await api.journal.update(entry.id, payload);
      } else {
        const payload: CreateJournalEntryInput = {
          date: new Date(date).toISOString(),
          title: title.trim() || undefined,
          mood: mood || undefined,
          content: content.trim(),
          tradeIds: tradeIds.length > 0 ? tradeIds : undefined,
        };
        await api.journal.create(payload);
      }
      toast.success(entry ? 'Entry updated' : 'Entry added');
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit entry' : 'New notebook entry'}</DialogTitle>
          <DialogDescription>Capture your mindset, mistakes and lessons.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {!entry && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Templates</Label>
              <div className="flex flex-wrap gap-2">
                {JOURNAL_TEMPLATES.map((t) => (
                  <Button
                    key={t.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTitle(t.title);
                      setContent(t.content);
                    }}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Mood</Label>
              <Select value={mood || NONE} onValueChange={(v) => setMood(v === NONE ? '' : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {MOODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Patience paid off today"
            />
          </div>
          <JournalTradePicker selected={tradeIds} onChange={setTradeIds} enabled={open} />
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Entry</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="What happened, how you felt, and what you'll do differently…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : entry ? 'Save changes' : 'Add entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
