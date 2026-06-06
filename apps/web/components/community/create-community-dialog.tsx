'use client';

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
import { Textarea } from '@/components/ui/textarea';
import { ApiError, api } from '@/lib/api-client';
import type { CommunityDetail } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CreateCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (community: CommunityDetail) => void;
}

export function CreateCommunityDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateCommunityDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Community name is required');
      return;
    }

    setSaving(true);
    try {
      const community = await api.communities.create({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast.success('Community created');
      onOpenChange(false);
      onCreated?.(community);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to create community';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create community</DialogTitle>
            <DialogDescription>
              Start a group to mentor traders and track collective progress.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="community-name">Name</Label>
              <Input
                id="community-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alpha Traders Circle"
                maxLength={120}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="community-description">Description (optional)</Label>
              <Textarea
                id="community-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this community about?"
                rows={3}
                maxLength={2000}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
