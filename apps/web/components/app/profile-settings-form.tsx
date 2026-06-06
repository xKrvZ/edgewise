'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api-client';
import { profileShareUrl } from '@/lib/share';
import type { Playbook, StatsVisibility, TraderProfile } from '@/lib/types';
import { STATS_VISIBILITIES } from '@/lib/types';
import { Copy, ExternalLink, ImagePlus, Loader2, Trash2, UserRound, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const STATS_VISIBILITY_LABELS: Record<StatsVisibility, string> = {
  private: 'Private',
  public: 'Public',
};

const MAX_SYMBOLS = 10;

function initials(name?: string | null): string {
  if (!name) return 'T';
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface ProfileSettingsFormProps {
  profile: TraderProfile;
  playbooks: Playbook[];
  onSaved: () => void;
}

export function ProfileSettingsForm({ profile, playbooks, onSaved }: ProfileSettingsFormProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>([]);
  const [symbolInput, setSymbolInput] = useState('');
  const [sharePlaybooks, setSharePlaybooks] = useState(false);
  const [sharedPlaybookIds, setSharedPlaybookIds] = useState<string[]>([]);
  const [statsVisibility, setStatsVisibility] = useState<StatsVisibility>('private');
  const [statsShareToken, setStatsShareToken] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [headerUrl, setHeaderUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);

  useEffect(() => {
    setDisplayName(profile.displayName ?? '');
    setBio(profile.bio ?? '');
    setFavoriteSymbols(profile.favoriteSymbols ?? []);
    setSharePlaybooks(profile.sharePlaybooks);
    setSharedPlaybookIds(profile.sharedPlaybookIds ?? []);
    setStatsVisibility(profile.statsVisibility);
    setStatsShareToken(profile.statsShareToken);
    setAvatarUrl(profile.avatarUrl);
    setHeaderUrl(profile.headerUrl);
  }, [profile]);

  const shareUrl = statsShareToken ? profileShareUrl(statsShareToken) : null;

  function addSymbol(raw: string) {
    const value = raw.trim().toUpperCase();
    if (!value) return;
    if (favoriteSymbols.includes(value)) {
      setSymbolInput('');
      return;
    }
    if (favoriteSymbols.length >= MAX_SYMBOLS) {
      toast.error(`At most ${MAX_SYMBOLS} symbols`);
      return;
    }
    setFavoriteSymbols((prev) => [...prev, value]);
    setSymbolInput('');
  }

  function removeSymbol(symbol: string) {
    setFavoriteSymbols((prev) => prev.filter((s) => s !== symbol));
  }

  function togglePlaybook(id: string, checked: boolean) {
    setSharedPlaybookIds((prev) =>
      checked ? [...prev, id] : prev.filter((pid) => pid !== id),
    );
  }

  async function handleAvatarUpload(file: File) {
    setUploadingAvatar(true);
    try {
      const updated = await api.profile.uploadAvatar(file);
      setAvatarUrl(updated.avatarUrl);
      setStatsShareToken(updated.statsShareToken);
      onSaved();
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleHeaderUpload(file: File) {
    setUploadingHeader(true);
    try {
      const updated = await api.profile.uploadHeader(file);
      setHeaderUrl(updated.headerUrl);
      setStatsShareToken(updated.statsShareToken);
      onSaved();
      toast.success('Header updated');
    } catch {
      toast.error('Failed to upload header');
    } finally {
      setUploadingHeader(false);
    }
  }

  async function removeAvatar() {
    setUploadingAvatar(true);
    try {
      const updated = await api.profile.update({ avatarStorageKey: null });
      setAvatarUrl(updated.avatarUrl);
      onSaved();
      toast.success('Avatar removed');
    } catch {
      toast.error('Failed to remove avatar');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function removeHeader() {
    setUploadingHeader(true);
    try {
      const updated = await api.profile.update({ headerStorageKey: null });
      setHeaderUrl(updated.headerUrl);
      onSaved();
      toast.success('Header removed');
    } catch {
      toast.error('Failed to remove header');
    } finally {
      setUploadingHeader(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.profile.update({
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
        favoriteSymbols,
        sharePlaybooks,
        sharedPlaybookIds: sharePlaybooks ? sharedPlaybookIds : [],
        statsVisibility,
      });
      setStatsShareToken(updated.statsShareToken);
      onSaved();
      toast.success('Profile saved');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Profile link copied');
    } catch {
      toast.error('Could not copy link');
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Header banner</h2>
          <p className="text-xs text-muted-foreground">
            Shown at the top of your public trader profile.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div
            className="relative flex h-32 items-center justify-center bg-muted sm:h-40"
            style={
              headerUrl
                ? {
                    backgroundImage: `url(${headerUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            {!headerUrl && (
              <span className="text-xs font-medium text-muted-foreground">No banner uploaded</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            <input
              ref={headerInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleHeaderUpload(file);
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={uploadingHeader}
              onClick={() => headerInputRef.current?.click()}
            >
              {uploadingHeader ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              Upload banner
            </Button>
            {headerUrl && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploadingHeader}
                onClick={() => void removeHeader()}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Avatar</h2>
          <p className="text-xs text-muted-foreground">Your profile picture on your public page.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <Avatar className="h-20 w-20 border border-border">
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName || 'Avatar'} />
            <AvatarFallback className="bg-primary/15 text-primary">
              {avatarUrl ? <UserRound className="h-7 w-7" /> : initials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap gap-2">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleAvatarUpload(file);
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
            >
              {uploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              Upload
            </Button>
            {avatarUrl && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploadingAvatar}
                onClick={() => void removeAvatar()}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="display-name">Display name</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How you appear on your public profile"
            maxLength={80}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell visitors about your trading style"
            rows={4}
            maxLength={500}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div>
          <Label htmlFor="favorite-symbols">Favorite symbols</Label>
          <p className="text-xs text-muted-foreground">Up to {MAX_SYMBOLS} symbols shown on your profile.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {favoriteSymbols.map((symbol) => (
            <Badge key={symbol} variant="secondary" className="gap-1 pr-1">
              {symbol}
              <button
                type="button"
                className="rounded-sm hover:bg-muted"
                onClick={() => removeSymbol(symbol)}
                aria-label={`Remove ${symbol}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          id="favorite-symbols"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addSymbol(symbolInput);
            }
          }}
          onBlur={() => addSymbol(symbolInput)}
          placeholder="Type a symbol and press Enter (max 10)"
          disabled={favoriteSymbols.length >= MAX_SYMBOLS}
          maxLength={16}
        />
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Show playbooks on profile</p>
            <p className="text-xs text-muted-foreground">
              Only name and description are shown publicly — never rules or checklists.
            </p>
          </div>
          <Switch checked={sharePlaybooks} onCheckedChange={setSharePlaybooks} />
        </div>
        {sharePlaybooks && (
          <div className="space-y-2 pt-1">
            {playbooks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No playbooks yet.</p>
            ) : (
              playbooks.map((playbook) => (
                <label
                  key={playbook.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border/60 p-3 transition-colors duration-150 hover:border-primary/25 hover:bg-muted/40"
                >
                  <Checkbox
                    checked={sharedPlaybookIds.includes(playbook.id)}
                    onCheckedChange={(checked) => togglePlaybook(playbook.id, checked === true)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{playbook.name}</span>
                    {playbook.description && (
                      <span className="block text-xs text-muted-foreground line-clamp-2">
                        {playbook.description}
                      </span>
                    )}
                  </span>
                </label>
              ))
            )}
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="stats-visibility">Stats visibility</Label>
          <Select
            value={statsVisibility}
            onValueChange={(v) => setStatsVisibility(v as StatsVisibility)}
          >
            <SelectTrigger id="stats-visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATS_VISIBILITIES.map((v) => (
                <SelectItem key={v} value={v}>
                  {STATS_VISIBILITY_LABELS[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            When public, aggregate stats appear on your profile link. Individual trades are never
            exposed.
          </p>
        </div>
      </section>

      {shareUrl && (
        <section className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm sm:p-6">
          <div>
            <p className="text-sm font-medium text-foreground">Public profile link</p>
            <p className="text-xs text-muted-foreground">Share this link to show your public profile.</p>
          </div>
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
        </section>
      )}

      <div className="flex justify-end border-t border-border/60 pt-6">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </div>
    </div>
  );
}
