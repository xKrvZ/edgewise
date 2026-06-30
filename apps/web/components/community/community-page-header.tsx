'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useHeaderImageContrast } from '@/lib/hooks/use-header-image-contrast';
import {
  headerOverlayButtonClass,
  resolveHeaderImageStyles,
} from '@/lib/header-image-styles';
import { cn } from '@/lib/utils';
import { ImagePlus, Loader2, Lock, MoreHorizontal, Trash2, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CommunityJoinConsentDialog } from '@/components/community/community-join-consent-dialog';
import { useCommunityJoinConsent } from '@/components/community/use-community-join-consent';
import {
  communityInvitationInfo,
  useCommunityInvitationActions,
} from '@/components/community/use-community-invitation-actions';
import { ApiError, api } from '@/lib/api-client';
import type { CommunityDetail } from '@/lib/types';

interface CommunityPageHeaderProps {
  community: CommunityDetail;
  canEditBranding: boolean;
  onUpdated: (community: CommunityDetail) => void;
}

export function CommunityPageHeader({
  community,
  canEditBranding,
  onUpdated,
}: CommunityPageHeaderProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(community.logoUrl ?? null);
  const [headerUrl, setHeaderUrl] = useState(community.headerUrl ?? null);
  const [headerPreviewUrl, setHeaderPreviewUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const joinConsent = useCommunityJoinConsent();
  const invitationActions = useCommunityInvitationActions({
    onAccepted: () => onUpdated(community),
    onDeclined: () => onUpdated(community),
  });
  const pendingInvitation = community.pendingInvitation;

  const isMember = community.myRole !== null;

  const headerAnalysisUrl = headerPreviewUrl ?? headerUrl;
  const { textTheme, analyzed, isLoading } = useHeaderImageContrast(headerAnalysisUrl);
  const { useLightText: useLightHeaderText, gradientClass: headerGradientClass } =
    resolveHeaderImageStyles(headerAnalysisUrl, textTheme, analyzed, isLoading);

  useEffect(() => {
    setLogoUrl(community.logoUrl ?? null);
    setHeaderUrl(community.headerUrl ?? null);
  }, [community.logoUrl, community.headerUrl]);

  const initials = community.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    try {
      const updated = await api.communities.uploadLogo(community.id, file);
      setLogoUrl(updated.logoUrl ?? null);
      onUpdated(updated);
      toast.success('Community logo updated');
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleHeaderUpload(file: File) {
    const previewUrl = URL.createObjectURL(file);
    setHeaderPreviewUrl(previewUrl);
    setUploadingHeader(true);
    try {
      const updated = await api.communities.uploadHeader(community.id, file);
      setHeaderUrl(updated.headerUrl ?? null);
      onUpdated(updated);
      toast.success('Community header updated');
    } catch {
      toast.error('Failed to upload header');
    } finally {
      URL.revokeObjectURL(previewUrl);
      setHeaderPreviewUrl(null);
      setUploadingHeader(false);
    }
  }

  async function removeHeader() {
    setUploadingHeader(true);
    try {
      const updated = await api.communities.removeHeader(community.id);
      setHeaderUrl(updated.headerUrl ?? null);
      onUpdated(updated);
      toast.success('Header removed');
    } catch {
      toast.error('Failed to remove header');
    } finally {
      setUploadingHeader(false);
    }
  }

  async function removeLogo() {
    setUploadingLogo(true);
    try {
      const updated = await api.communities.removeLogo(community.id);
      setLogoUrl(updated.logoUrl ?? null);
      onUpdated(updated);
      toast.success('Logo removed');
    } catch {
      toast.error('Failed to remove logo');
    } finally {
      setUploadingLogo(false);
    }
  }

  function handleJoinClick() {
    joinConsent.openConsent(
      {
        communityId: community.id,
        communityName: community.name,
        logoUrl: logoUrl ?? community.logoUrl,
      },
      async () => {
        try {
          const updated = await api.communities.join(community.id);
          onUpdated(updated);
          toast.success(`Joined ${community.name}`);
        } catch (err) {
          const message = err instanceof ApiError ? err.message : 'Failed to join community';
          toast.error(message);
          throw err;
        }
      },
    );
  }

  return (
    <div className="space-y-4">
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
      <div
        className={cn(
          'relative flex min-h-48 items-center overflow-hidden rounded-2xl px-4 py-6 sm:min-h-52 sm:px-6 sm:py-8',
          headerUrl ? 'bg-muted' : 'bg-muted/40',
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
        {headerGradientClass ? (
          <div
            className={cn(
              'pointer-events-none absolute inset-0 z-[1]',
              headerGradientClass,
            )}
            aria-hidden="true"
          />
        ) : null}

        {canEditBranding ? (
          <>
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
            <div className="absolute right-4 top-4 z-20">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={uploadingHeader}
                    aria-label="Community header actions"
                    className={cn(useLightHeaderText && headerOverlayButtonClass)}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    disabled={uploadingHeader}
                    onClick={() => headerInputRef.current?.click()}
                  >
                    <ImagePlus />
                    Change header
                  </DropdownMenuItem>
                  {headerUrl ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={uploadingHeader}
                        onClick={() => void removeHeader()}
                      >
                        <Trash2 />
                        Remove header
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : null}

        <div className="relative z-10 flex w-full flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="relative shrink-0">
                {canEditBranding ? (
                  <>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleLogoUpload(file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      className="group relative rounded-full ring-4 ring-background focus-visible:ring-primary focus-visible:outline-none"
                      disabled={uploadingLogo}
                      onClick={() => logoInputRef.current?.click()}
                      aria-label="Change community logo"
                    >
                      <Avatar className="h-20 w-20 bg-primary text-primary-foreground shadow-md sm:h-24 sm:w-24">
                        <AvatarImage src={logoUrl ?? undefined} alt={community.name} />
                        <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground sm:text-xl">
                          {uploadingLogo ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            initials || <Users className="h-6 w-6" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span className="pointer-events-none absolute inset-0 rounded-full bg-slate-950/0 transition-colors group-hover:bg-slate-950/10" />
                    </button>
                    {logoUrl ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="absolute -right-1 -bottom-1 h-7 w-7 rounded-full bg-background shadow-sm"
                        disabled={uploadingLogo}
                        onClick={() => void removeLogo()}
                        aria-label="Remove logo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <Avatar className="h-20 w-20 ring-4 ring-background sm:h-24 sm:w-24">
                    <AvatarImage src={logoUrl ?? undefined} alt={community.name} />
                    <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground sm:text-xl">
                      {initials || <Users className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1
                    className={cn(
                      'text-2xl font-semibold tracking-tight',
                      headerAnalysisUrl &&
                        (useLightHeaderText ? 'text-white' : 'text-slate-950'),
                    )}
                  >
                    {community.name}
                  </h1>
                  {community.myRole ? (
                    <Badge
                      variant="secondary"
                      className={cn(
                        'capitalize',
                        headerAnalysisUrl &&
                          (useLightHeaderText
                            ? 'border-white/25 bg-white/15 text-white hover:bg-white/15'
                            : 'text-slate-950'),
                      )}
                    >
                      {community.myRole}
                    </Badge>
                  ) : null}
                  <Badge
                    variant="outline"
                    className={cn(
                      headerAnalysisUrl &&
                        (useLightHeaderText
                          ? 'border-white/25 bg-white/10 text-white hover:bg-white/10'
                          : 'text-slate-700'),
                    )}
                  >
                    {community.joinPolicy === 'public' ? 'Public' : 'Invite only'}
                  </Badge>
                </div>
                {community.description ? (
                  <p
                    className={cn(
                      'max-w-2xl',
                      headerAnalysisUrl
                        ? useLightHeaderText
                          ? 'text-white/80'
                          : 'text-slate-600'
                        : 'text-muted-foreground',
                    )}
                  >
                    {community.description}
                  </p>
                ) : (
                  <p
                    className={cn(
                      'italic',
                      headerAnalysisUrl
                        ? useLightHeaderText
                          ? 'text-white/70'
                          : 'text-slate-500'
                        : 'text-muted-foreground',
                    )}
                  >
                    No description
                  </p>
                )}
                <p
                  className={cn(
                    'mt-2 text-sm',
                    headerAnalysisUrl
                      ? useLightHeaderText
                        ? 'text-white/70'
                        : 'text-slate-600'
                      : 'text-muted-foreground',
                  )}
                >
                  {community.memberCount} member{community.memberCount === 1 ? '' : 's'}
                </p>
              </div>
            </div>

          {!isMember ? (
            <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
              {pendingInvitation ? (
                <>
                  <Button
                    type="button"
                    variant="success"
                    onClick={() =>
                      invitationActions.acceptInvitation(
                        pendingInvitation,
                        communityInvitationInfo({ ...community, logoUrl: logoUrl ?? community.logoUrl }),
                      )
                    }
                    disabled={invitationActions.isBusy(pendingInvitation.id)}
                  >
                    {invitationActions.isBusy(pendingInvitation.id) && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Accept invite
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void invitationActions.declineInvitation(pendingInvitation.id)}
                    disabled={invitationActions.isBusy(pendingInvitation.id)}
                  >
                    <X className="h-4 w-4" />
                    Decline
                  </Button>
                </>
              ) : community.joinPolicy === 'public' ? (
                <Button
                  type="button"
                  onClick={handleJoinClick}
                  disabled={joinConsent.confirming}
                  className={cn(
                    headerAnalysisUrl &&
                      (useLightHeaderText
                        ? 'border-white/25 bg-white/15 text-white hover:bg-white/20'
                        : undefined),
                  )}
                  variant={headerAnalysisUrl && useLightHeaderText ? 'outline' : 'default'}
                >
                  {joinConsent.confirming && <Loader2 className="h-4 w-4 animate-spin" />}
                  Join
                </Button>
              ) : (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 text-sm font-medium',
                    headerAnalysisUrl
                      ? useLightHeaderText
                        ? 'text-white/80'
                        : 'text-slate-600'
                      : 'text-muted-foreground',
                  )}
                >
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  Invite required
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
