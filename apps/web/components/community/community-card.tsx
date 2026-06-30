'use client';

import { CommunityJoinConsentDialog } from '@/components/community/community-join-consent-dialog';
import { useCommunityJoinConsent } from '@/components/community/use-community-join-consent';
import {
  communityInvitationInfo,
  useCommunityInvitationActions,
} from '@/components/community/use-community-invitation-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ApiError, api } from '@/lib/api-client';
import type { CommunitySummary } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowRight, Loader2, Lock, Star, Users, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface CommunityCardProps {
  community: CommunitySummary;
  onJoined?: () => void;
  className?: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  mentor: 'Mentor',
  member: 'Member',
};

const JOIN_POLICY_LABELS: Record<string, string> = {
  public: 'Public',
  invite_only: 'Invite only',
};

function communityInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function CommunityCard({ community, onJoined, className }: CommunityCardProps) {
  const joinConsent = useCommunityJoinConsent();
  const invitationActions = useCommunityInvitationActions({ onAccepted: onJoined, onDeclined: onJoined });
  const isMember = community.myRole !== null;
  const pendingInvitation = community.pendingInvitation;
  const href = `/community/${community.id}`;
  const initials = communityInitials(community.name);

  function handleJoinClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    joinConsent.openConsent(
      {
        communityId: community.id,
        communityName: community.name,
        logoUrl: community.logoUrl,
      },
      async () => {
        try {
          await api.communities.join(community.id);
          toast.success(`Joined ${community.name}`);
          onJoined?.();
        } catch (err) {
          const message = err instanceof ApiError ? err.message : 'Failed to join community';
          toast.error(message);
          throw err;
        }
      },
    );
  }

  return (
    <>
      <CommunityJoinConsentDialog
        open={joinConsent.open}
        onOpenChange={joinConsent.setOpen}
        community={joinConsent.target}
        confirmLabel={joinConsent.confirmLabel}
        confirming={joinConsent.confirming}
        onConfirm={joinConsent.handleConfirm}
      />
      <CommunityJoinConsentDialog
        open={invitationActions.joinConsent.open}
        onOpenChange={invitationActions.joinConsent.setOpen}
        community={invitationActions.joinConsent.target}
        confirmLabel={invitationActions.joinConsent.confirmLabel}
        confirming={invitationActions.joinConsent.confirming}
        onConfirm={invitationActions.joinConsent.handleConfirm}
      />
      <Link
        href={href}
        className={cn(
          'group flex h-full flex-col rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md',
          className,
        )}
      >
        <div className="relative aspect-[16/7] overflow-hidden rounded-t-xl bg-muted/40">
          {community.headerUrl ? (
            // biome-ignore lint/performance/noImgElement: presigned S3 URLs are not compatible with next/image
            <img
              src={community.headerUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-muted/50 to-primary/10">
              <Users className="h-7 w-7 text-muted-foreground/40" aria-hidden="true" />
            </div>
          )}

          {isMember && community.myRole ? (
            <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-0.5 text-[11px] font-bold text-primary shadow-sm backdrop-blur-sm">
              {ROLE_LABELS[community.myRole] ?? community.myRole}
            </span>
          ) : community.joinPolicy === 'public' ? (
            <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-0.5 text-[11px] font-bold text-primary shadow-sm backdrop-blur-sm">
              {JOIN_POLICY_LABELS.public}
            </span>
          ) : (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-0.5 text-[11px] font-bold text-primary shadow-sm backdrop-blur-sm">
              <Lock className="h-3 w-3" aria-hidden="true" />
              {JOIN_POLICY_LABELS.invite_only}
            </span>
          )}

          {community.featured ? (
            <span
              className="absolute right-3 top-3 inline-flex items-center rounded-full bg-background/90 p-1.5 shadow-sm backdrop-blur-sm"
              title="Featured community"
            >
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span className="sr-only">Featured community</span>
            </span>
          ) : null}
        </div>

        <div className="relative z-20 -mt-6 px-4">
          <Avatar className="h-14 w-14 border-2 border-card bg-card shadow-md ring-1 ring-border/50">
            {community.logoUrl ? (
              // biome-ignore lint/performance/noImgElement: presigned S3 URLs are not compatible with next/image
              <AvatarImage src={community.logoUrl} alt="" />
            ) : null}
            <AvatarFallback className="bg-muted text-sm font-semibold text-muted-foreground">
              {initials || <Users className="h-5 w-5" aria-hidden="true" />}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="relative z-10 flex flex-1 flex-col px-4 pb-4 pt-1.5">
          <h3 className="text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {community.name}
          </h3>
          <p
            className={cn(
              'mt-1.5 flex-1 line-clamp-2 text-sm leading-5',
              community.description ? 'text-muted-foreground' : 'italic text-muted-foreground/70',
            )}
          >
            {community.description ?? 'No description'}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                {community.memberCount} member{community.memberCount === 1 ? '' : 's'}
              </span>
            </div>

            {!isMember && pendingInvitation ? (
              <div className="flex shrink-0 gap-1.5" onClick={(e) => e.preventDefault()}>
                <Button
                  size="sm"
                  variant="success"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    invitationActions.acceptInvitation(
                      pendingInvitation,
                      communityInvitationInfo(community),
                    );
                  }}
                  disabled={invitationActions.isBusy(pendingInvitation.id)}
                  className="shrink-0"
                >
                  {invitationActions.isBusy(pendingInvitation.id) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void invitationActions.declineInvitation(pendingInvitation.id);
                  }}
                  disabled={invitationActions.isBusy(pendingInvitation.id)}
                  className="shrink-0 px-2"
                  aria-label="Decline invitation"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : !isMember && community.joinPolicy === 'public' ? (
              <Button
                size="sm"
                onClick={handleJoinClick}
                disabled={joinConsent.confirming}
                className="shrink-0"
              >
                {joinConsent.confirming && <Loader2 className="h-4 w-4 animate-spin" />}
                Join
              </Button>
            ) : !isMember && community.joinPolicy === 'invite_only' ? (
              <span className="shrink-0 text-xs text-muted-foreground">Invite required</span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                View community
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </span>
            )}
          </div>
        </div>
      </Link>
    </>
  );
}

export function CommunityCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-xl border border-border bg-card shadow-sm',
        className,
      )}
    >
      <div className="aspect-[16/7] rounded-t-xl bg-muted/40" />
      <div className="relative z-20 -mt-6 px-4">
        <div className="h-14 w-14 rounded-full bg-muted" />
      </div>
      <div className="space-y-2 px-4 pb-4 pt-1.5">
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-full rounded bg-muted/70" />
          <div className="h-3.5 w-5/6 rounded bg-muted/70" />
        </div>
        <div className="mt-3 border-t border-border/60 pt-3">
          <div className="h-3.5 w-1/3 rounded bg-muted/70" />
        </div>
      </div>
    </div>
  );
}
