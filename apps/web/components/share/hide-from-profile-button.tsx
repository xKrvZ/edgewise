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
import { api } from '@/lib/api-client';
import { EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface HideFromProfileButtonProps {
  tradeId: string;
  symbol: string;
}

type SavingVisibility = 'unlisted' | 'private' | null;

export function HideFromProfileButton({ tradeId, symbol }: HideFromProfileButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<SavingVisibility>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (saving !== null) {
      return;
    }
    setOpen(nextOpen);
  }

  async function handleVisibilityChange(visibility: 'unlisted' | 'private') {
    setSaving(visibility);
    try {
      await api.trades.updateSharing(tradeId, { visibility });
      setOpen(false);
      toast.success(
        visibility === 'private'
          ? `${symbol} is now private and removed from your profile`
          : `${symbol} is unlisted and removed from your profile — the share link still works`,
      );
      router.refresh();
    } catch {
      toast.error('Could not update trade visibility');
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-slate-700"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Hide ${symbol} from profile`}
        title="Hide from profile"
      >
        <EyeOff className="h-4 w-4" aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent onClick={(event) => event.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Remove from profile</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Choose how to hide{' '}
                  <span className="font-medium text-foreground">{symbol}</span> from your public
                  profile.
                </p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>
                    <span className="font-medium text-foreground">Unlisted</span> — removed from
                    your profile, but anyone with the share link can still view the trade.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Private</span> — removed from your
                    profile and sharing is disabled; the share link will no longer work.
                  </li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={saving !== null}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving !== null}
              onClick={() => handleVisibilityChange('unlisted')}
            >
              {saving === 'unlisted' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Making unlisted…
                </>
              ) : (
                'Make unlisted'
              )}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={saving !== null}
              onClick={() => handleVisibilityChange('private')}
            >
              {saving === 'private' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Making private…
                </>
              ) : (
                'Make private'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
