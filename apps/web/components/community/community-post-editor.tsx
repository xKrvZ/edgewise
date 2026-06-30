'use client';

import { CommunityRichTextEditor } from '@/components/community/community-rich-text-editor';
import { api } from '@/lib/api-client';
import { useCallback } from 'react';

interface CommunityPostEditorProps {
  communityId: string;
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

export function CommunityPostEditor({
  communityId,
  value,
  onChange,
  disabled = false,
}: CommunityPostEditorProps) {
  const uploadImage = useCallback(
    async (file: File) => {
      const target = await api.communities.requestPostContentImageUpload(communityId, file);
      const put = await fetch(target.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      if (!put.ok) {
        throw new Error(`Upload failed (${put.status})`);
      }
      return {
        downloadUrl: target.downloadUrl,
        storageKey: target.storageKey,
      };
    },
    [communityId],
  );

  return (
    <CommunityRichTextEditor
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder="Share your thoughts with the community…"
      onUploadImage={uploadImage}
    />
  );
}
