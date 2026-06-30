'use client';

import { useCommunityDetail } from '@/components/community/community-detail-context';
import { CommunityPostOverviewCard } from '@/components/community/community-post-overview-card';
import {
  DiscordIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
  type BrandIconComponent,
} from '@/components/community/social-icons';
import { EmptyState } from '@/components/shared/empty-state';
import { ListSection } from '@/components/shared/list-section';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import { fetchPublicCommunityPosts } from '@/lib/public-api';
import { isLikelyHtml, sanitizePostHtml, stripHtmlToPlainText } from '@/lib/sanitize-html';
import { cn } from '@/lib/utils';
import { ExternalLink, Globe, Users, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

const factPillClass =
  'inline-flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm';

function CommunityFactPill({
  icon: Icon,
  label,
  className,
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn(factPillClass, className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="font-medium text-foreground">{label}</span>
    </div>
  );
}

function CommunitySocialLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: BrandIconComponent | LucideIcon;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        factPillClass,
        'font-medium text-foreground transition-[border-color,background-color,box-shadow] duration-150 hover:border-primary/25 hover:bg-muted/30 hover:shadow-sm',
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span>{label}</span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </a>
  );
}

export default function CommunityAboutPage() {
  const { community } = useCommunityDetail();
  const isMember = community.myRole !== null;
  const postsQuery = useQuery(
    () =>
      isMember
        ? api.communities.listPosts(community.id, { limit: 3 })
        : fetchPublicCommunityPosts(community.id, { limit: 3 }),
    [community.id, isMember],
  );
  const latestPosts = (postsQuery.data ?? []).slice(0, 3);
  const isOwner = community.myRole === 'owner';
  const aboutContent = community.aboutContent?.trim();
  const description = community.description?.trim();
  const websiteUrl = community.websiteUrl?.trim();
  const discordUrl = community.discordUrl?.trim();
  const instagramUrl = community.instagramUrl?.trim();
  const tiktokUrl = community.tiktokUrl?.trim();
  const youtubeUrl = community.youtubeUrl?.trim();
  const memberLabel = `${community.memberCount} member${community.memberCount === 1 ? '' : 's'}`;
  const aboutPlainText = aboutContent
    ? isLikelyHtml(aboutContent)
      ? stripHtmlToPlainText(aboutContent)
      : aboutContent
    : '';
  const showDescription =
    Boolean(description) &&
    (!aboutPlainText || description!.toLowerCase() !== aboutPlainText.toLowerCase());
  const sanitizedAboutContent = useMemo(() => {
    if (!aboutContent) {
      return '';
    }
    if (!isLikelyHtml(aboutContent)) {
      return aboutContent;
    }
    return sanitizePostHtml(aboutContent);
  }, [aboutContent]);

  return (
    <div className="space-y-10">
      <ListSection title="Overview">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <CommunityFactPill icon={Users} label={memberLabel} />
            {websiteUrl ? (
              <CommunitySocialLink href={websiteUrl} icon={Globe} label="Website" />
            ) : null}
            {discordUrl ? (
              <CommunitySocialLink href={discordUrl} icon={DiscordIcon} label="Discord" />
            ) : null}
            {instagramUrl ? (
              <CommunitySocialLink href={instagramUrl} icon={InstagramIcon} label="Instagram" />
            ) : null}
            {tiktokUrl ? (
              <CommunitySocialLink href={tiktokUrl} icon={TikTokIcon} label="TikTok" />
            ) : null}
            {youtubeUrl ? (
              <CommunitySocialLink href={youtubeUrl} icon={YouTubeIcon} label="YouTube" />
            ) : null}
          </div>

          {showDescription ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}

          {aboutContent ? (
            isLikelyHtml(aboutContent) ? (
              <div
                className="community-post-body max-w-3xl text-sm leading-relaxed text-foreground"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via DOMPurify
                dangerouslySetInnerHTML={{ __html: sanitizedAboutContent }}
              />
            ) : (
              <div className="max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {aboutContent}
              </div>
            )
          ) : (
            <EmptyState
              icon={Users}
              variant="embedded"
              title="Nothing here yet"
              message={
                isOwner
                  ? 'Add an about page in Settings to welcome members and share what your community is about.'
                  : 'The community owner has not added an about page yet.'
              }
              action={
                isOwner ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/community/${community.id}/settings`}>Go to Settings</Link>
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      </ListSection>

      {!postsQuery.isLoading && !postsQuery.error && latestPosts.length > 0 ? (
        <ListSection title="Latest posts">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {latestPosts.map((post) => (
              <CommunityPostOverviewCard key={post.id} communityId={community.id} post={post} />
            ))}
          </div>
        </ListSection>
      ) : null}
    </div>
  );
}
