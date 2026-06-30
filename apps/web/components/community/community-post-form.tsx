'use client';



import { CommunityPostEditor } from '@/components/community/community-post-editor';

import { CommunityPostHeaderUpload } from '@/components/community/community-post-header-upload';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Switch } from '@/components/ui/switch';

import { ApiError, api } from '@/lib/api-client';

import type { CommunityPostDetail, CommunityPostVisibility } from '@/lib/types';

import { Loader2 } from 'lucide-react';

import { useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';

import { toast } from 'sonner';



const MAX_TITLE_LENGTH = 200;



function isEditorContentEmpty(html: string): boolean {

  const text = html

    .replace(/<[^>]+>/g, ' ')

    .replace(/&nbsp;/gi, ' ')

    .replace(/\s+/g, ' ')

    .trim();

  return text.length === 0;

}



interface CommunityPostFormProps {

  communityId: string;

  post?: CommunityPostDetail;

  onSaved?: (post: CommunityPostDetail) => void;

  onCancel?: () => void;

}



export function CommunityPostForm({

  communityId,

  post,

  onSaved,

  onCancel,

}: CommunityPostFormProps) {

  const router = useRouter();

  const isEditing = Boolean(post);

  const [title, setTitle] = useState(post?.title ?? '');

  const [content, setContent] = useState(post?.content ?? '');

  const [headerStorageKey, setHeaderStorageKey] = useState<string | null>(null);

  const [headerPreviewUrl, setHeaderPreviewUrl] = useState<string | null>(post?.headerUrl ?? null);

  const [headerDirty, setHeaderDirty] = useState(false);

  const [visibility, setVisibility] = useState<CommunityPostVisibility>(
    post?.visibility ?? 'private',
  );

  const [commentsEnabled, setCommentsEnabled] = useState(post?.commentsEnabled ?? true);

  const [saving, setSaving] = useState(false);



  useEffect(() => {

    setTitle(post?.title ?? '');

    setContent(post?.content ?? '');

    setHeaderStorageKey(null);

    setHeaderPreviewUrl(post?.headerUrl ?? null);

    setHeaderDirty(false);

    setVisibility(post?.visibility ?? 'private');

    setCommentsEnabled(post?.commentsEnabled ?? true);

  }, [post]);



  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();



    const trimmedTitle = title.trim();

    if (!trimmedTitle) {

      toast.error('Title is required');

      return;

    }

    if (isEditorContentEmpty(content)) {

      toast.error('Content is required');

      return;

    }



    setSaving(true);

    try {

      const payload = {

        title: trimmedTitle,

        content,

        visibility,

        commentsEnabled,

        ...(headerDirty ? { headerStorageKey } : {}),

      };



      const saved = post

        ? await api.communities.updatePost(communityId, post.id, payload)

        : await api.communities.createPost(communityId, {

            ...payload,

            headerStorageKey: headerStorageKey ?? undefined,

          });

      toast.success(isEditing ? 'Post updated' : 'Post published');

      onSaved?.(saved);

      if (!onSaved) {

        router.push(`/community/${communityId}/posts/${saved.id}`);

      }

    } catch (err) {

      const message = err instanceof ApiError ? err.message : 'Failed to save post';

      toast.error(message);

    } finally {

      setSaving(false);

    }

  }



  return (

    <form onSubmit={handleSubmit} className="space-y-6 pb-12">

      <CommunityPostHeaderUpload

        communityId={communityId}

        headerUrl={headerPreviewUrl}

        headerStorageKey={headerStorageKey}

        disabled={saving}

        onHeaderChange={(storageKey, previewUrl) => {

          setHeaderStorageKey(storageKey);

          setHeaderPreviewUrl(previewUrl);

          setHeaderDirty(true);

        }}

      />



      <div className="space-y-2">

        <Label htmlFor="post-title">Title</Label>

        <Input

          id="post-title"

          value={title}

          onChange={(e) => setTitle(e.target.value)}

          maxLength={MAX_TITLE_LENGTH}

          placeholder="Weekly market recap"

          required

        />

      </div>



      <div className="space-y-2">

        <Label htmlFor="post-content">Content</Label>

        <CommunityPostEditor

          communityId={communityId}

          value={content}

          onChange={setContent}

          disabled={saving}

        />

      </div>



      <div className="grid gap-6 sm:grid-cols-2 sm:items-start">
        <div className="space-y-2">
          <Label htmlFor="post-visibility">Visibility</Label>
          <Select
            value={visibility}
            onValueChange={(value) => setVisibility(value as CommunityPostVisibility)}
            disabled={saving}
          >
            <SelectTrigger id="post-visibility" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Community only</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Public posts can be viewed by anyone with the link. Private posts are visible to
            community members only.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="post-comments-enabled">Comments</Label>
          <div className="flex h-9 items-center">
            <Switch
              id="post-comments-enabled"
              checked={commentsEnabled}
              onCheckedChange={setCommentsEnabled}
              disabled={saving}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            When enabled, signed-in users can comment based on the post visibility setting.
          </p>
        </div>
      </div>



      <div className="flex flex-wrap items-center gap-2">

        <Button type="submit" disabled={saving}>

          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}

          {isEditing ? 'Save changes' : 'Publish post'}

        </Button>

        {onCancel ? (

          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>

            Cancel

          </Button>

        ) : null}

      </div>

    </form>

  );

}

