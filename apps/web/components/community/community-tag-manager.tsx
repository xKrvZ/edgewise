'use client';

import { MultiSelect, type MultiSelectOption } from '@/components/shared/multi-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ApiError, api } from '@/lib/api-client';
import type { CommunityTag } from '@/lib/types';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CommunityTagManagerProps {
  communityId: string;
  tags: CommunityTag[];
  onChanged: () => void;
}

const TAG_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function CommunityTagManager({ communityId, tags, onChanged }: CommunityTagManagerProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(TAG_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Tag name is required');
      return;
    }

    setSaving(true);
    try {
      await api.communities.createTag(communityId, { name: trimmed, color });
      toast.success('Tag created');
      setCreateOpen(false);
      setName('');
      setColor(TAG_COLORS[0]);
      onChanged();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create tag';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tag: CommunityTag) {
    setDeletingId(tag.id);
    try {
      await api.communities.removeTag(communityId, tag.id);
      toast.success(`Removed "${tag.name}"`);
      onChanged();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete tag';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Member tags</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New tag
          </Button>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Create tags to label and filter members in this community.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="gap-1.5 pr-1"
                  style={
                    tag.color
                      ? { backgroundColor: `${tag.color}22`, color: tag.color }
                      : undefined
                  }
                >
                  {tag.name}
                  <button
                    type="button"
                    aria-label={`Delete ${tag.name}`}
                    disabled={deletingId === tag.id}
                    onClick={() => handleDelete(tag)}
                    className="inline-flex rounded-full p-0.5 hover:opacity-70 disabled:opacity-50"
                  >
                    {deletingId === tag.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create tag</DialogTitle>
              <DialogDescription>
                Tags help you organize and filter members in this community.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tag-name">Name</Label>
                <Input
                  id="tag-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Beginner"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Color ${c}`}
                      onClick={() => setColor(c)}
                      className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-105"
                      style={{
                        backgroundColor: c,
                        borderColor: color === c ? 'var(--foreground)' : 'transparent',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
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
    </>
  );
}

interface MemberTagEditorProps {
  communityId: string;
  memberUserId: string;
  memberName: string;
  tagOptions: MultiSelectOption[];
  selectedTagIds: string[];
  onSaved: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberTagEditor({
  communityId,
  memberUserId,
  memberName,
  tagOptions,
  selectedTagIds,
  onSaved,
  open,
  onOpenChange,
}: MemberTagEditorProps) {
  const [tagIds, setTagIds] = useState<string[]>(selectedTagIds);
  const [saving, setSaving] = useState(false);

  const initialKey = useMemo(() => selectedTagIds.join(','), [selectedTagIds]);

  function handleOpenChange(next: boolean) {
    if (next) {
      setTagIds(selectedTagIds);
    }
    onOpenChange(next);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.communities.setMemberTags(communityId, memberUserId, { tagIds });
      toast.success('Tags updated');
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update tags';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} key={initialKey}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tags for {memberName}</DialogTitle>
          <DialogDescription>Assign community tags to this member.</DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <MultiSelect
            options={tagOptions}
            selected={tagIds}
            onChange={setTagIds}
            placeholder="Select tags"
            emptyText="Create tags first."
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={handleSave}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function tagToMultiSelectOption(tag: CommunityTag): MultiSelectOption {
  return { value: tag.id, label: tag.name, color: tag.color };
}

export function CommunityTagBadge({ tag }: { tag: CommunityTag }) {
  return (
    <Badge
      variant="secondary"
      className="text-xs"
      style={tag.color ? { backgroundColor: `${tag.color}22`, color: tag.color } : undefined}
    >
      {tag.name}
    </Badge>
  );
}
