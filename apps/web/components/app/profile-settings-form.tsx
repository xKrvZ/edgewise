'use client';

import { AccountSettingsSection } from '@/components/account/account-settings-section';
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
import { marketingCardClass } from '@/components/marketing/marketing-section';
import { api } from '@/lib/api-client';
import { useSession } from '@/lib/auth-client';
import { profileShareUrl } from '@/lib/share';
import type { Account, Playbook, StatsVisibility, TraderProfile } from '@/lib/types';
import { STATS_VISIBILITIES } from '@/lib/types';
import { userDisplayName, userInitials } from '@/lib/user-display';
import { cn } from '@/lib/utils';
import {
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const STATS_VISIBILITY_LABELS: Record<StatsVisibility, string> = {
  private: 'Private',
  public: 'Public',
};

const MAX_SYMBOLS = 10;

interface ProfileSettingsFormProps {
  profile: TraderProfile;
  playbooks: Playbook[];
  accounts: Account[];
  onSaved: () => void;
}

interface ProfileFieldRowProps {
  label: string;
  value: string;
  isEditing?: boolean;
  inputId?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

function ProfileFieldRow({
  label,
  value,
  isEditing,
  inputId,
  inputValue,
  onInputChange,
  placeholder,
  maxLength,
}: ProfileFieldRowProps) {
  return (
    <div className="space-y-1 py-4 first:pt-0">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      {isEditing && inputId && onInputChange ? (
        <Input
          id={inputId}
          value={inputValue ?? ''}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="max-w-md border-slate-200"
        />
      ) : (
        <p className="text-sm text-slate-500">{value || '—'}</p>
      )}
    </div>
  );
}

export function ProfileSettingsForm({ profile, playbooks, accounts, onSaved }: ProfileSettingsFormProps) {
  const { data: session, isPending: sessionPending } = useSession();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>([]);
  const [symbolInput, setSymbolInput] = useState('');
  const [sharePlaybooks, setSharePlaybooks] = useState(false);
  const [sharedPlaybookIds, setSharedPlaybookIds] = useState<string[]>([]);
  const [shareTrades, setShareTrades] = useState(false);
  const [publicTradingAccountIds, setPublicTradingAccountIds] = useState<string[]>([]);
  const [statsVisibility, setStatsVisibility] = useState<StatsVisibility>('private');
  const [statsShareToken, setStatsShareToken] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [headerUrl, setHeaderUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);

  const user = session?.user;
  const fullName = user?.name ?? '';
  const email = user?.email ?? '';
  const resolvedDisplayName = userDisplayName({
    displayName: profile.displayName,
    name: fullName,
    email,
  });
  const avatarInitials = userInitials({
    displayName: profile.displayName,
    name: fullName,
    email,
  });

  useEffect(() => {
    setDisplayName(profile.displayName ?? '');
    setBio(profile.bio ?? '');
    setFavoriteSymbols(profile.favoriteSymbols ?? []);
    setSharePlaybooks(profile.sharePlaybooks);
    setSharedPlaybookIds(profile.sharedPlaybookIds ?? []);
    setShareTrades(profile.shareTrades);
    setPublicTradingAccountIds(profile.publicTradingAccountIds ?? []);
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

  function toggleTradingAccount(id: string, checked: boolean) {
    setPublicTradingAccountIds((prev) =>
      checked ? [...prev, id] : prev.filter((aid) => aid !== id),
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
        shareTrades,
        sharedTradeIds: [],
        publicTradingAccountIds,
        statsVisibility,
      });
      setStatsShareToken(updated.statsShareToken);
      onSaved();
      setIsEditing(false);
      toast.success('Profile saved');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setDisplayName(profile.displayName ?? '');
    setBio(profile.bio ?? '');
    setIsEditing(false);
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
    <div className="space-y-8">
      {/* Banner with integrated avatar */}
      <div
        className={cn(
          'relative flex h-32 items-center justify-between gap-4 overflow-hidden rounded-2xl px-4 sm:h-36 sm:px-6',
          headerUrl ? 'bg-slate-200' : 'bg-slate-100',
        )}
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

        <button
          type="button"
          className="group relative z-10 shrink-0 rounded-full ring-4 ring-white focus-visible:ring-primary focus-visible:outline-none"
          disabled={uploadingAvatar}
          onClick={() => avatarInputRef.current?.click()}
          aria-label="Change avatar"
        >
          <Avatar className="h-20 w-20 bg-primary text-primary-foreground shadow-md sm:h-24 sm:w-24">
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName || 'Avatar'} />
            <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground sm:text-xl">
              {uploadingAvatar ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                avatarInitials
              )}
            </AvatarFallback>
          </Avatar>
          <span className="pointer-events-none absolute inset-0 rounded-full bg-slate-950/0 transition-colors group-hover:bg-slate-950/10" />
        </button>

        <div className="relative z-10 flex shrink-0 gap-2">
          {headerUrl ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/80 bg-white/90 text-slate-700 shadow-sm hover:bg-white"
              disabled={uploadingHeader}
              onClick={() => void removeHeader()}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Remove</span>
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="font-semibold shadow-sm"
            disabled={uploadingHeader}
            onClick={() => headerInputRef.current?.click()}
          >
            {uploadingHeader ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            Change header
          </Button>
        </div>
      </div>

      {/* About you card */}
      <div className={cn(marketingCardClass, 'px-4 py-6 sm:px-6')}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">About you</h2>
          {isEditing ? (
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="font-semibold text-slate-600"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" className="font-semibold" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 font-semibold text-slate-900 hover:text-primary"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          {sessionPending ? (
            <span className="inline-block h-4 w-48 animate-pulse rounded bg-slate-100" />
          ) : (
            <span>{email || '—'}</span>
          )}
        </div>

        <div className="mt-6 space-y-2">
          <Label htmlFor="bio" className="text-sm font-semibold text-slate-900">
            Bio
          </Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A bit more about you..."
            rows={4}
            maxLength={500}
            className="resize-y border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400"
          />
        </div>

        <div className="mt-2 divide-y divide-slate-100">
          <ProfileFieldRow label="Full name" value={fullName || resolvedDisplayName} />
          <ProfileFieldRow
            label="Display name"
            value={displayName || profile.displayName || '—'}
            isEditing={isEditing}
            inputId="display-name"
            inputValue={displayName}
            onInputChange={setDisplayName}
            placeholder="How you appear on your public profile"
            maxLength={80}
          />
        </div>

      </div>

      {/* Additional profile settings */}
      <AccountSettingsSection title="Trading profile">
        <div className="divide-y divide-slate-100 px-4 sm:px-5">
          <div className="space-y-3 py-4 sm:py-5">
            <div>
              <Label htmlFor="favorite-symbols" className="text-sm font-semibold text-slate-900">
                Favorite symbols
              </Label>
              <p className="mt-1 text-xs text-slate-500">
                Up to {MAX_SYMBOLS} symbols shown on your public profile.
              </p>
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
              placeholder="Type a symbol and press Enter"
              disabled={favoriteSymbols.length >= MAX_SYMBOLS}
              maxLength={16}
              className="max-w-md border-slate-200"
            />
          </div>

          <div className="space-y-3 py-4 sm:py-5">
            <div>
              <p className="text-sm font-semibold text-slate-900">Public journals</p>
              <p className="mt-1 text-xs text-slate-500">
                Choose which journals contribute stats and shared trades on your public profile.
                Leave all unchecked to hide journal data from visitors.
              </p>
            </div>
            {accounts.length === 0 ? (
              <p className="text-sm text-slate-500">No journals yet.</p>
            ) : (
              accounts.map((account) => (
                <label
                  key={account.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:border-primary/25 hover:bg-slate-50"
                >
                  <Checkbox
                    checked={publicTradingAccountIds.includes(account.id)}
                    onCheckedChange={(checked) =>
                      toggleTradingAccount(account.id, checked === true)
                    }
                    className="mt-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900">{account.name}</span>
                    {account.broker ? (
                      <span className="block text-xs text-slate-500">{account.broker}</span>
                    ) : null}
                  </span>
                </label>
              ))
            )}
          </div>

          <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">Show playbooks on profile</p>
              <p className="text-xs text-slate-500">
                Only name and description are shown publicly — never rules or checklists.
              </p>
            </div>
            <Switch checked={sharePlaybooks} onCheckedChange={setSharePlaybooks} />
          </div>

          {sharePlaybooks ? (
            <div className="space-y-2 pb-4 sm:pb-5">
              {playbooks.length === 0 ? (
                <p className="text-sm text-slate-500">No playbooks yet.</p>
              ) : (
                playbooks.map((playbook) => (
                  <label
                    key={playbook.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:border-primary/25 hover:bg-slate-50"
                  >
                    <Checkbox
                      checked={sharedPlaybookIds.includes(playbook.id)}
                      onCheckedChange={(checked) => togglePlaybook(playbook.id, checked === true)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-900">{playbook.name}</span>
                      {playbook.description ? (
                        <span className="block text-xs text-slate-500 line-clamp-2">
                          {playbook.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))
              )}
            </div>
          ) : null}

          <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">Show public trades on profile</p>
              <p className="text-xs text-slate-500">
                When enabled, your public shared trades from the journals you selected above appear
                on your profile. When disabled, visitors will not see a trades section.
              </p>
            </div>
            <Switch checked={shareTrades} onCheckedChange={setShareTrades} />
          </div>
        </div>
      </AccountSettingsSection>

      <AccountSettingsSection title="Visibility">
        <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
          <div className="space-y-2">
            <Label htmlFor="stats-visibility" className="text-sm font-semibold text-slate-900">
              Stats visibility
            </Label>
            <Select
              value={statsVisibility}
              onValueChange={(v) => setStatsVisibility(v as StatsVisibility)}
            >
              <SelectTrigger id="stats-visibility" className="max-w-xs border-slate-200">
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
            <p className="text-xs text-slate-500">
              When public, aggregate stats appear on your profile link for the journals you select
              above. Enable &ldquo;Show public trades on profile&rdquo; to include individual
              trades as well.
            </p>
          </div>

          {shareUrl ? (
            <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Globe className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Public profile link</p>
                    <p className="text-xs text-slate-500">Share this link to show your public profile.</p>
                  </div>
                  <p className="break-all font-mono text-xs text-slate-600">{shareUrl}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={copyLink}>
                      <Copy className="h-3.5 w-3.5" />
                      Copy link
                    </Button>
                    <Button type="button" size="sm" variant="outline" asChild>
                      <Link href={shareUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Preview
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </AccountSettingsSection>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={saving} size="lg">
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
