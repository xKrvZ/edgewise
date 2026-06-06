'use client';

import { CommentForm } from '@/components/comments/comment-form';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { api } from '@/lib/api-client';
import { formatDateTime } from '@/lib/format';
import type { Comment, CommentAccess, CommentTargetType } from '@/lib/types';
import { MessageSquareReply, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CommentThreadProps {
  targetType: CommentTargetType;
  targetId: string;
  comments: Comment[];
  access: CommentAccess;
  onChanged: () => void;
}

export function CommentThread({
  targetType,
  targetId,
  comments,
  access,
  onChanged,
}: CommentThreadProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const showTopLevelForm =
    access.canComment && access.communities.length > 0 && !access.isContentOwner;

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              targetType={targetType}
              targetId={targetId}
              access={access}
              currentUserId={currentUserId}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}

      {showTopLevelForm && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="mb-3 text-sm font-medium">Leave feedback</p>
          <CommentForm
            targetType={targetType}
            targetId={targetId}
            communities={access.communities}
            onSubmitted={onChanged}
          />
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  targetType,
  targetId,
  access,
  currentUserId,
  onChanged,
  depth = 0,
}: {
  comment: Comment;
  targetType: CommentTargetType;
  targetId: string;
  access: CommentAccess;
  currentUserId?: string;
  onChanged: () => void;
  depth?: number;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canReply =
    access.isContentOwner ||
    (access.canComment && access.communities.some((c) => c.id === comment.communityId));
  const canDelete =
    comment.authorId === currentUserId ||
    (access.canComment && !access.isContentOwner);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.comments.remove(comment.id);
      onChanged();
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    } finally {
      setDeleting(false);
    }
  }

  const replyCommunities = access.isContentOwner
    ? [{ id: comment.communityId, name: '' }]
    : access.communities.filter((c) => c.id === comment.communityId);

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-border pl-4' : undefined}>
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{comment.authorName}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</p>
          </div>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete comment"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
        <p className="whitespace-pre-wrap text-sm text-foreground/90">{comment.body}</p>
        {canReply && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setReplyOpen((v) => !v)}
          >
            <MessageSquareReply className="h-3.5 w-3.5" />
            Reply
          </Button>
        )}
        {replyOpen && canReply && (
          <div className="mt-3 border-t border-border pt-3">
            <CommentForm
              targetType={targetType}
              targetId={targetId}
              communities={replyCommunities.length > 0 ? replyCommunities : access.communities}
              parentId={comment.id}
              placeholder="Write a reply…"
              onSubmitted={() => {
                setReplyOpen(false);
                onChanged();
              }}
              onCancel={() => setReplyOpen(false)}
              compact
            />
          </div>
        )}
      </div>

      {comment.replies?.map((reply) => (
        <div key={reply.id} className="mt-3">
          <CommentItem
            comment={reply}
            targetType={targetType}
            targetId={targetId}
            access={access}
            currentUserId={currentUserId}
            onChanged={onChanged}
            depth={depth + 1}
          />
        </div>
      ))}
    </div>
  );
}
