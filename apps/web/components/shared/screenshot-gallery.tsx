'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import type { MediaVisibility, Screenshot } from '@/lib/types';
import { Globe, Loader2, Lock, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface ScreenshotGalleryProps {
  tradeId?: string;
  playbookId?: string;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

const VISIBILITY_LABELS: Record<MediaVisibility, string> = {
  private: 'Private',
  public: 'Public on share link',
};

export function ScreenshotGallery({ tradeId, playbookId }: ScreenshotGalleryProps) {
  const filterKey = `${tradeId ?? ''}:${playbookId ?? ''}`;
  const { data, isLoading, refetch } = useQuery(
    () => api.screenshots.list({ tradeId, playbookId }),
    [filterKey],
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const screenshots = data ?? [];
  const showShareVisibility = Boolean(tradeId);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    let uploaded = 0;
    try {
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith('video/');
        const max = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
        if (file.size > max) {
          toast.error(`${file.name} is too large (max ${isVideo ? '200' : '10'} MB)`);
          continue;
        }
        await api.screenshots.upload(file, { tradeId, playbookId });
        uploaded += 1;
      }
      if (uploaded > 0) {
        toast.success(`Uploaded ${uploaded} file${uploaded === 1 ? '' : 's'}`);
        refetch();
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function remove(id: string) {
    try {
      await api.screenshots.remove(id);
      refetch();
    } catch {
      toast.error('Could not remove media');
    }
  }

  async function updateVisibility(id: string, visibility: MediaVisibility) {
    setUpdatingId(id);
    try {
      await api.screenshots.update(id, { visibility });
      refetch();
    } catch {
      toast.error('Could not update visibility');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Screenshots &amp; videos</span>
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {showShareVisibility && (
        <p className="text-xs text-muted-foreground">
          Mark items as public to include them on your trade share link. Private items stay visible
          only to you.
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="aspect-video animate-pulse rounded-md bg-accent" />
          <div className="aspect-video animate-pulse rounded-md bg-accent" />
        </div>
      ) : screenshots.length === 0 ? (
        <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
          No media attached. Upload chart screenshots or trade recordings.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {screenshots.map((s) => (
            <MediaTile
              key={s.id}
              item={s}
              showShareVisibility={showShareVisibility}
              updating={updatingId === s.id}
              onRemove={() => remove(s.id)}
              onVisibilityChange={(visibility) => updateVisibility(s.id, visibility)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MediaTileProps {
  item: Screenshot;
  showShareVisibility: boolean;
  updating: boolean;
  onRemove: () => void;
  onVisibilityChange: (visibility: MediaVisibility) => void;
}

function MediaTile({
  item,
  showShareVisibility,
  updating,
  onRemove,
  onVisibilityChange,
}: MediaTileProps) {
  const isPublic = item.visibility === 'public';

  return (
    <figure className="group relative overflow-hidden rounded-md border">
      {item.kind === 'video' ? (
        // biome-ignore lint/a11y/useMediaCaption: user-generated trade clips have no captions track.
        <video
          src={item.url}
          controls
          preload="metadata"
          className="aspect-video w-full bg-black object-contain"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.url}
          alt={item.caption ?? 'Trade screenshot'}
          className="aspect-video w-full object-cover"
        />
      )}

      <div className="absolute left-1 top-1 flex items-center gap-1">
        {showShareVisibility && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex rounded-md bg-background/80 p-1 text-muted-foreground"
                  aria-label={isPublic ? 'Public on share link' : 'Private'}
                >
                  {isPublic ? (
                    <Globe className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {isPublic
                  ? 'Public — appears on your trade share link'
                  : 'Private — hidden from your trade share link'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="absolute right-1 top-1 flex items-center gap-1">
        {showShareVisibility && (
          <Select
            value={item.visibility}
            onValueChange={(v) => onVisibilityChange(v as MediaVisibility)}
            disabled={updating}
          >
            <SelectTrigger
              size="sm"
              className="hidden h-7 w-[7.5rem] bg-background/80 text-xs group-hover:flex"
              aria-label="Share link visibility"
            >
              {updating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">{VISIBILITY_LABELS.private}</SelectItem>
              <SelectItem value="public">{VISIBILITY_LABELS.public}</SelectItem>
            </SelectContent>
          </Select>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="hidden rounded-md bg-background/80 p-1 text-destructive group-hover:block"
          aria-label="Remove media"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {item.caption && (
        <figcaption className="truncate px-2 py-1 text-xs text-muted-foreground">
          {item.caption}
        </figcaption>
      )}
    </figure>
  );
}
