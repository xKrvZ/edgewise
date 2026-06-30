'use client';

import { ReviewBlock } from '@/components/playbooks/playbook-flow-form-dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { ApiError, api } from '@/lib/api-client';
import type { CommunityPlaybookTemplate } from '@/lib/types';
import { Copy, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CommunityPlaybookCloneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  template: CommunityPlaybookTemplate | null;
  onCloned: () => void;
}

function formatChecklistPreview(template: CommunityPlaybookTemplate): string {
  if (template.checklist.length === 0) {
    return '';
  }

  const previewItems = template.checklist.slice(0, 5);
  const lines = previewItems.map((item) => `• ${item.text}`);
  if (template.checklist.length > 5) {
    lines.push(`+${template.checklist.length - 5} more items`);
  }
  return lines.join('\n');
}

export function CommunityPlaybookCloneDialog({
  open,
  onOpenChange,
  communityId,
  template,
  onCloned,
}: CommunityPlaybookCloneDialogProps) {
  const [name, setName] = useState('');
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name);
    }
  }, [template]);

  async function handleClone() {
    if (!template) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Name is required');
      return;
    }

    setCloning(true);
    try {
      await api.communities.clonePlaybookTemplate(communityId, template.id, {
        name: trimmedName,
      });
      toast.success(`"${trimmedName}" added to your playbooks`);
      onOpenChange(false);
      onCloned();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to clone template');
    } finally {
      setCloning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Clone to my playbooks</DialogTitle>
          <DialogDescription>
            Create a personal copy of &ldquo;{template?.name}&rdquo;. You can rename it before
            cloning.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="clone-playbook-name">Playbook name</Label>
            <Input
              id="clone-playbook-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your playbook"
              maxLength={120}
              disabled={cloning}
            />
          </div>

          {template ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                What will be copied
              </p>
              <ScrollArea className="min-h-0 flex-1 rounded-md border bg-muted/30 p-4">
                <div className="space-y-4 pr-3">
                  <ReviewBlock label="Description" value={template.description ?? ''} />
                  <ReviewBlock label="Market conditions" value={template.marketConditions ?? ''} />
                  <ReviewBlock label="Entry criteria" value={template.entryCriteria ?? ''} />
                  <ReviewBlock label="Exit criteria" value={template.exitCriteria ?? ''} />
                  <ReviewBlock label="Risk rules" value={template.riskRules ?? ''} />
                  <ReviewBlock label="Invalidation rules" value={template.invalidationRules ?? ''} />
                  <ReviewBlock label="Checklist" value={formatChecklistPreview(template)} />
                </div>
              </ScrollArea>
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={cloning}>
            Cancel
          </Button>
          <Button type="button" onClick={handleClone} disabled={cloning || !name.trim()}>
            {cloning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            Clone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
