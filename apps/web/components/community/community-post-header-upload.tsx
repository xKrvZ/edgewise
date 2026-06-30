'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface CommunityPostHeaderUploadProps {
  communityId: string;
  headerUrl?: string | null;
  headerStorageKey: string | null;
  onHeaderChange: (storageKey: string | null, previewUrl: string | null) => void;
  disabled?: boolean;
}

export function CommunityPostHeaderUpload({
  communityId,
  headerUrl,
  headerStorageKey,
  onHeaderChange,
  disabled = false,
}: CommunityPostHeaderUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(headerUrl ?? null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPreviewUrl(headerUrl ?? null);
  }, [headerUrl]);

  async function handleUpload(file: File) {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);
    try {
      const target = await api.communities.requestPostHeaderUpload(communityId, file);
      const put = await fetch(target.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      if (!put.ok) {
        throw new Error(`Upload failed (${put.status})`);
      }
      onHeaderChange(target.storageKey, objectUrl);
      toast.success('Header image uploaded');
    } catch {
      setPreviewUrl(headerUrl ?? null);
      onHeaderChange(headerStorageKey, headerUrl ?? null);
      toast.error('Failed to upload header image');
    } finally {
      URL.revokeObjectURL(objectUrl);
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreviewUrl(null);
    onHeaderChange(null, null);
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border border-dashed border-border/80 bg-muted/20',
          previewUrl ? 'border-solid' : 'min-h-44',
        )}
      >
        {previewUrl ? (
          <>
            {/* biome-ignore lint/performance/noImgElement: presigned S3 hero preview */}
            <img
              src={previewUrl}
              alt=""
              className="aspect-[21/9] max-h-72 w-full object-cover"
            />
            {!disabled ? (
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                >
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Replace
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={uploading}
                  onClick={handleRemove}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="flex min-h-44 w-full flex-col items-center justify-center gap-2 px-4 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ImagePlus className="h-6 w-6" />
            )}
            <span>Add a cover image (optional)</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) {
            void handleUpload(file);
          }
        }}
      />
    </div>
  );
}
