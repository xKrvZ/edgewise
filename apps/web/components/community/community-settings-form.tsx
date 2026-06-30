'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CommunityRichTextEditor } from '@/components/community/community-rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError, api } from '@/lib/api-client';
import type { CommunityDetail, CommunityJoinPolicy, CommunityLeaderboardVisibility } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { LEADERBOARD_VISIBILITY_HELP } from '@/components/community/community-leaderboard.util';
import { toast } from 'sonner';

const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_URL_LENGTH = 2048;

interface CommunitySettingsFormProps {
  community: CommunityDetail;
  onSaved: () => void;
}

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function CommunitySettingsForm({ community, onSaved }: CommunitySettingsFormProps) {
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(community.websiteUrl ?? '');
  const [discordUrl, setDiscordUrl] = useState(community.discordUrl ?? '');
  const [instagramUrl, setInstagramUrl] = useState(community.instagramUrl ?? '');
  const [tiktokUrl, setTiktokUrl] = useState(community.tiktokUrl ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState(community.youtubeUrl ?? '');
  const [aboutContent, setAboutContent] = useState(community.aboutContent ?? '');
  const [joinPolicy, setJoinPolicy] = useState<CommunityJoinPolicy>(
    community.joinPolicy ?? 'invite_only',
  );
  const [leaderboardVisibility, setLeaderboardVisibility] =
    useState<CommunityLeaderboardVisibility>(community.leaderboardVisibility ?? 'mentors');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(community.name);
    setDescription(community.description ?? '');
    setWebsiteUrl(community.websiteUrl ?? '');
    setDiscordUrl(community.discordUrl ?? '');
    setInstagramUrl(community.instagramUrl ?? '');
    setTiktokUrl(community.tiktokUrl ?? '');
    setYoutubeUrl(community.youtubeUrl ?? '');
    setAboutContent(community.aboutContent ?? '');
    setJoinPolicy(community.joinPolicy ?? 'invite_only');
    setLeaderboardVisibility(community.leaderboardVisibility ?? 'mentors');
  }, [community]);

  const uploadAboutImage = useCallback(
    async (file: File) => {
      const target = await api.communities.requestPostContentImageUpload(community.id, file);
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
    [community.id],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Community name is required');
      return;
    }

    const normalizedWebsite = normalizeUrl(websiteUrl);
    const normalizedDiscord = normalizeUrl(discordUrl);
    const normalizedInstagram = normalizeUrl(instagramUrl);
    const normalizedTiktok = normalizeUrl(tiktokUrl);
    const normalizedYoutube = normalizeUrl(youtubeUrl);

    if (normalizedWebsite && !isValidUrl(normalizedWebsite)) {
      toast.error('Website must be a valid URL');
      return;
    }

    if (normalizedDiscord && !isValidUrl(normalizedDiscord)) {
      toast.error('Discord link must be a valid URL');
      return;
    }

    if (normalizedInstagram && !isValidUrl(normalizedInstagram)) {
      toast.error('Instagram link must be a valid URL');
      return;
    }

    if (normalizedTiktok && !isValidUrl(normalizedTiktok)) {
      toast.error('TikTok link must be a valid URL');
      return;
    }

    if (normalizedYoutube && !isValidUrl(normalizedYoutube)) {
      toast.error('YouTube link must be a valid URL');
      return;
    }

    setSaving(true);
    try {
      await api.communities.update(community.id, {
        name: trimmedName,
        description: description.trim() || null,
        websiteUrl: normalizedWebsite,
        discordUrl: normalizedDiscord,
        instagramUrl: normalizedInstagram,
        tiktokUrl: normalizedTiktok,
        youtubeUrl: normalizedYoutube,
        aboutContent: aboutContent.trim() || null,
        joinPolicy,
        leaderboardVisibility,
      });
      toast.success('Community settings saved');
      onSaved();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save settings';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Community profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="community-name">Name</Label>
              <Input
                id="community-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Community name"
                maxLength={MAX_NAME_LENGTH}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="community-description">Description</Label>
              <Textarea
                id="community-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary shown in the community header"
                rows={3}
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="community-join-policy">Who can join</Label>
              <Select
                value={joinPolicy}
                onValueChange={(value) => setJoinPolicy(value as CommunityJoinPolicy)}
              >
                <SelectTrigger id="community-join-policy" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="invite_only">Invite only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {joinPolicy === 'public'
                  ? 'Anyone can join this community without an invitation.'
                  : 'New members must be invited by an owner or mentor.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="community-leaderboard-visibility">Leaderboard visibility</Label>
              <Select
                value={leaderboardVisibility}
                onValueChange={(value) =>
                  setLeaderboardVisibility(value as CommunityLeaderboardVisibility)
                }
              >
                <SelectTrigger id="community-leaderboard-visibility" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="members">Members only</SelectItem>
                  <SelectItem value="mentors">Mentors only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {LEADERBOARD_VISIBILITY_HELP[leaderboardVisibility]}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="community-website">Website</Label>
              <Input
                id="community-website"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                maxLength={MAX_URL_LENGTH}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="community-discord">Discord</Label>
              <Input
                id="community-discord"
                type="url"
                value={discordUrl}
                onChange={(e) => setDiscordUrl(e.target.value)}
                placeholder="https://discord.gg/your-invite"
                maxLength={MAX_URL_LENGTH}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="community-instagram">Instagram</Label>
              <Input
                id="community-instagram"
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/yourcommunity"
                maxLength={MAX_URL_LENGTH}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="community-tiktok">TikTok</Label>
              <Input
                id="community-tiktok"
                type="url"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="https://tiktok.com/@yourcommunity"
                maxLength={MAX_URL_LENGTH}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="community-youtube">YouTube</Label>
              <Input
                id="community-youtube"
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/@yourcommunity"
                maxLength={MAX_URL_LENGTH}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Overview page</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="community-about">About content</Label>
              <p className="text-sm text-muted-foreground">
                Shown on the Overview tab — welcome members, share rules, goals, or how to get
                started.
              </p>
              <CommunityRichTextEditor
                value={aboutContent}
                onChange={setAboutContent}
                disabled={saving}
                placeholder="Welcome to our community! We focus on..."
                minHeightClassName="min-h-72"
                onUploadImage={uploadAboutImage}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
