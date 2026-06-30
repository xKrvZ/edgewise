'use client';

import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, api } from '@/lib/api-client';
import { fetchPublicCommunityPostComments } from '@/lib/public-api';
import { formatDateTime } from '@/lib/format';
import type {
  CommunityPostComment,
  CommunityPostCommentReactionType,
  CommunityPostDetail,
  CommunityPostVisibility,
} from '@/lib/types';
import { Loader2, MessageSquareReply, Send, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const MAX_COMMENT_LENGTH = 2000;

interface CommunityPostCommentsProps {
  communityId: string;
  post: CommunityPostDetail;
  isMember: boolean;
  currentUserId?: string | null;
  isCommunityOwner?: boolean;
  usePublicCommentsApi?: boolean;
}

interface CommentNode extends CommunityPostComment {
  replies: CommentNode[];
}

function canUserComment(
  post: CommunityPostDetail,
  isMember: boolean,
  currentUserId?: string | null,
): boolean {
  if (!post.commentsEnabled || !currentUserId) {
    return false;
  }
  if (post.visibility === 'public') {
    return true;
  }
  return isMember;
}

function canUserDeleteComment(
  comment: CommunityPostComment,
  post: CommunityPostDetail,
  currentUserId?: string | null,
  isCommunityOwner?: boolean,
): boolean {
  if (!currentUserId) {
    return false;
  }
  return (
    comment.authorUserId === currentUserId ||
    post.authorUserId === currentUserId ||
    Boolean(isCommunityOwner)
  );
}

function buildCommentTree(comments: CommunityPostComment[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const comment of comments) {
    nodes.set(comment.id, { ...comment, replies: [] });
  }

  for (const comment of comments) {
    const node = nodes.get(comment.id)!;
    if (comment.parentCommentId) {
      const parent = nodes.get(comment.parentCommentId);
      if (parent) {
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function collectDescendantIds(comments: CommunityPostComment[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const comment of comments) {
      if (comment.parentCommentId && ids.has(comment.parentCommentId) && !ids.has(comment.id)) {
        ids.add(comment.id);
        changed = true;
      }
    }
  }
  return ids;
}

export function CommunityPostComments({
  communityId,
  post,
  isMember,
  currentUserId,
  isCommunityOwner,
  usePublicCommentsApi = false,
}: CommunityPostCommentsProps) {
  const [comments, setComments] = useState<CommunityPostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [reactingId, setReactingId] = useState<string | null>(null);

  const canComment = useMemo(
    () => canUserComment(post, isMember, currentUserId),
    [post, isMember, currentUserId],
  );

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  const loadComments = useCallback(async () => {
    if (post.isDeleted || !post.commentsEnabled) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows =
        usePublicCommentsApi && !currentUserId
          ? await fetchPublicCommunityPostComments(communityId, post.id)
          : await api.communities.listPostComments(communityId, post.id);
      setComments(rows);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load comments';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [communityId, post.commentsEnabled, post.id, post.isDeleted, usePublicCommentsApi, currentUserId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  async function handleSubmit(parentCommentId?: string) {
    const trimmed = (parentCommentId ? replyBody : body).trim();
    if (!trimmed) {
      toast.error('Comment cannot be empty');
      return;
    }

    if (parentCommentId) {
      setReplySubmitting(true);
    } else {
      setSubmitting(true);
    }

    try {
      const created = await api.communities.createPostComment(communityId, post.id, {
        body: trimmed,
        ...(parentCommentId ? { parentCommentId } : {}),
      });
      setComments((prev) => [...prev, created]);
      if (parentCommentId) {
        setReplyBody('');
        setReplyingToId(null);
        toast.success('Reply posted');
      } else {
        setBody('');
        toast.success('Comment posted');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to post comment';
      toast.error(message);
    } finally {
      setSubmitting(false);
      setReplySubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    try {
      await api.communities.removePostComment(communityId, post.id, commentId);
      const removeIds = collectDescendantIds(comments, commentId);
      setComments((prev) => prev.filter((item) => !removeIds.has(item.id)));
      toast.success('Comment deleted');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete comment';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleReaction(
    commentId: string,
    type: CommunityPostCommentReactionType,
    currentReaction: CommunityPostCommentReactionType | null,
  ) {
    if (!canComment) {
      return;
    }

    const nextType = currentReaction === type ? null : type;
    setReactingId(commentId);
    try {
      const result = await api.communities.setPostCommentReaction(
        communityId,
        post.id,
        commentId,
        { type: nextType },
      );
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                likeCount: result.likeCount,
                dislikeCount: result.dislikeCount,
                userReaction: result.userReaction,
              }
            : comment,
        ),
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update reaction';
      toast.error(message);
    } finally {
      setReactingId(null);
    }
  }

  function renderComment(comment: CommentNode, depth = 0) {
    const showReplyForm = replyingToId === comment.id;

    return (
      <li key={comment.id} className="list-none">
        <article
          className="flex gap-3 border-b border-border/60 pb-4"
          style={depth > 0 ? { marginLeft: `${Math.min(depth, 4) * 1.25}rem` } : undefined}
        >
          <UserAvatar
            name={comment.authorDisplayName}
            avatarUrl={comment.authorAvatarUrl}
            className="mt-0.5 h-8 w-8 shrink-0"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-foreground">{comment.authorDisplayName}</span>
              <time className="text-xs text-muted-foreground" dateTime={comment.createdAt}>
                {formatDateTime(comment.createdAt)}
              </time>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {comment.body}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-7 gap-1 px-2 text-xs ${
                  comment.userReaction === 'like' ? 'text-primary' : 'text-muted-foreground'
                }`}
                disabled={!canComment || reactingId === comment.id}
                onClick={() => handleReaction(comment.id, 'like', comment.userReaction)}
                aria-label="Like comment"
                aria-pressed={comment.userReaction === 'like'}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                {comment.likeCount > 0 ? comment.likeCount : null}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-7 gap-1 px-2 text-xs ${
                  comment.userReaction === 'dislike' ? 'text-destructive' : 'text-muted-foreground'
                }`}
                disabled={!canComment || reactingId === comment.id}
                onClick={() => handleReaction(comment.id, 'dislike', comment.userReaction)}
                aria-label="Dislike comment"
                aria-pressed={comment.userReaction === 'dislike'}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                {comment.dislikeCount > 0 ? comment.dislikeCount : null}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                disabled={!canComment}
                onClick={() => {
                  setReplyingToId(showReplyForm ? null : comment.id);
                  setReplyBody('');
                }}
              >
                <MessageSquareReply className="h-3.5 w-3.5" />
                Reply
              </Button>
            </div>
            {showReplyForm && canComment ? (
              <div className="space-y-2 pt-1">
                <Textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder={`Reply to ${comment.authorDisplayName}…`}
                  rows={2}
                  maxLength={MAX_COMMENT_LENGTH}
                  className="min-h-[56px] resize-y"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSubmit(comment.id)}
                    disabled={replySubmitting || !replyBody.trim()}
                  >
                    {replySubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Reply
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplyingToId(null);
                      setReplyBody('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          {canUserDeleteComment(comment, post, currentUserId, isCommunityOwner) ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground"
              disabled={deletingId === comment.id}
              onClick={() => handleDelete(comment.id)}
              aria-label="Delete comment"
            >
              {deletingId === comment.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          ) : null}
        </article>
        {comment.replies.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  }

  if (post.isDeleted) {
    return (
      <section className="mx-auto max-w-3xl border-t border-border/60 pt-10">
        <p className="text-sm text-muted-foreground">
          Comments are not available because this article was deleted.
        </p>
      </section>
    );
  }

  if (!post.commentsEnabled) {
    return null;
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4 border-t border-border/60 pt-10">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Comments</h2>
        <p className="text-sm text-muted-foreground">
          {commentPermissionHint(post.visibility, isMember)}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : commentTree.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-4">{commentTree.map((comment) => renderComment(comment))}</ul>
      )}

      {canComment ? (
        <div className="space-y-3 border-t border-border/60 pt-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a comment…"
            rows={3}
            maxLength={MAX_COMMENT_LENGTH}
            className="min-h-[72px] resize-y"
          />
          <Button type="button" size="sm" onClick={() => handleSubmit()} disabled={submitting || !body.trim()}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Comment
          </Button>
        </div>
      ) : !currentUserId ? (
        <p className="border-t border-border/60 pt-4 text-sm text-muted-foreground">
          Sign in to comment, reply, or react.
        </p>
      ) : null}
    </section>
  );
}

function commentPermissionHint(visibility: CommunityPostVisibility, isMember: boolean): string {
  if (visibility === 'public') {
    return 'Anyone signed in can comment, reply, and react.';
  }
  if (isMember) {
    return 'Community members can comment, reply, and react.';
  }
  return 'Comments are limited to community members.';
}
