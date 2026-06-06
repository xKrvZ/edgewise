'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function ChecklistEditor({ playbookId }: { playbookId: string }) {
  const { data, isLoading, refetch } = useQuery(
    () => api.playbooks.listChecklist(playbookId),
    [playbookId],
  );
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const items = (data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);

  async function add() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.playbooks.addChecklistItem(playbookId, {
        text: text.trim(),
        sortOrder: items.length,
      });
      setText('');
      refetch();
    } catch {
      toast.error('Could not add item');
    } finally {
      setBusy(false);
    }
  }

  async function remove(itemId: string) {
    try {
      await api.playbooks.removeChecklistItem(playbookId, itemId);
      refetch();
    } catch {
      toast.error('Could not remove item');
    }
  }

  return (
    <div className="space-y-3">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading checklist…</p>
      ) : items.length === 0 ? (
        <p className="rounded-md border border-dashed py-4 text-center text-sm text-muted-foreground">
          No checklist items yet. Add the must-haves for this setup.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="group flex items-center gap-2 rounded-md border bg-card/50 px-3 py-2 text-sm"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              <span className="flex-1">{item.text}</span>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="hidden text-destructive group-hover:block"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a checklist item…"
        />
        <Button onClick={add} disabled={busy || !text.trim()}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}
