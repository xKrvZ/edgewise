'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api, ApiError } from '@/lib/api-client';
import type { CommentTargetType } from '@/lib/types';
import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CommentFormProps {
  targetType: CommentTargetType;
  targetId: string;
  communities: Array<{ id: string; name: string }>;
  parentId?: string;
  placeholder?: string;
  onSubmitted: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

export function CommentForm({
  targetType,
  targetId,
  communities,
  parentId,
  placeholder = 'Write a comment…',
  onSubmitted,
  onCancel,
  compact = false,
}: CommentFormProps) {
  const [body, setBody] = useState('');
  const [communityId, setCommunityId] = useState(communities[0]?.id ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) {
      toast.error('Comment cannot be empty');
      return;
    }
    if (!communityId) {
      toast.error('Select a community');
      return;
    }

    setSubmitting(true);
    try {
      await api.comments.create({
        targetType,
        targetId,
        communityId,
        parentId,
        body: trimmed,
      });
      setBody('');
      onSubmitted();
      toast.success(parentId ? 'Reply posted' : 'Comment posted');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to post comment';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {communities.length > 1 && !parentId && (
        <Select value={communityId} onValueChange={setCommunityId}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Community" />
          </SelectTrigger>
          <SelectContent>
            {communities.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        maxLength={2000}
        className="resize-y min-h-[72px]"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={submitting || !body.trim()}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {parentId ? 'Reply' : 'Comment'}
        </Button>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
