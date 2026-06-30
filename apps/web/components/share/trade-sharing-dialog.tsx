'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api-client';
import { tradeShareUrl } from '@/lib/share';
import type { Trade, TradeVisibility } from '@/lib/types';
import { TRADE_VISIBILITIES } from '@/lib/types';
import { Copy, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const VISIBILITY_LABELS: Record<TradeVisibility, string> = {
  private: 'Private',
  unlisted: 'Unlisted (link only)',
  public: 'Public',
};

interface TradeSharingDialogProps {
  trade: Trade;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function TradeSharingDialog({
  trade,
  open,
  onOpenChange,
  onUpdated,
}: TradeSharingDialogProps) {
  const [visibility, setVisibility] = useState<TradeVisibility>(trade.visibility ?? 'private');
  const [shareToken, setShareToken] = useState<string | null>(trade.shareToken ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setVisibility(trade.visibility ?? 'private');
      setShareToken(trade.shareToken ?? null);
    }
  }, [open, trade.visibility, trade.shareToken]);

  const shareUrl = shareToken ? tradeShareUrl(shareToken) : null;

  async function handleVisibilityChange(next: TradeVisibility) {
    setSaving(true);
    try {
      const result = await api.trades.updateSharing(trade.id, { visibility: next });
      setVisibility(result.visibility);
      setShareToken(result.shareToken);
      onUpdated();
      toast.success(
        next === 'private'
          ? 'Trade is now private'
          : next === 'unlisted'
            ? 'Share link updated — anyone with the link can view'
            : 'Share link updated — trade will appear on your public profile',
      );
    } catch {
      toast.error('Failed to update sharing settings');
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied');
    } catch {
      toast.error('Could not copy link');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share trade</DialogTitle>
          <DialogDescription>
            Control who can view this trade. Unlisted links work for anyone with the URL; public
            trades may be indexed and appear on your public profile. Only media marked &quot;public
            on share link&quot; is included in the shared view.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trade-visibility">Visibility</Label>
            <Select
              value={visibility}
              onValueChange={(v) => handleVisibilityChange(v as TradeVisibility)}
              disabled={saving}
            >
              <SelectTrigger id="trade-visibility" className="w-full">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </span>
                ) : (
                  <SelectValue />
                )}
              </SelectTrigger>
              <SelectContent>
                {TRADE_VISIBILITIES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {VISIBILITY_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {shareUrl && (
            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Share link</p>
              <p className="break-all font-mono text-sm">{shareUrl}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                  Copy link
                </Button>
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link href={shareUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Preview
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
