'use client';

import { useCommunityJoinConsent } from '@/components/community/use-community-join-consent';
import { ApiError, api } from '@/lib/api-client';
import type { CommunityPendingInvitation, CommunitySummary } from '@/lib/types';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface InvitationCommunityInfo {
  communityId: string;
  communityName: string;
  logoUrl?: string | null;
}

interface UseCommunityInvitationActionsOptions {
  onAccepted?: () => void;
  onDeclined?: () => void;
}

export function useCommunityInvitationActions(
  options: UseCommunityInvitationActionsOptions = {},
) {
  const joinConsent = useCommunityJoinConsent();
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const acceptInvitation = useCallback(
    (invitation: CommunityPendingInvitation, community: InvitationCommunityInfo) => {
      joinConsent.openConsent(
        {
          communityId: community.communityId,
          communityName: community.communityName,
          logoUrl: community.logoUrl,
        },
        async () => {
          try {
            await api.invitations.accept(invitation.id);
            toast.success(`Joined ${community.communityName}`);
            options.onAccepted?.();
          } catch (err) {
            const message =
              err instanceof ApiError ? err.message : 'Failed to accept invitation';
            toast.error(message);
            throw err;
          }
        },
        { confirmLabel: 'Accept and join' },
      );
    },
    [joinConsent, options],
  );

  const declineInvitation = useCallback(
    async (invitationId: string) => {
      setDecliningId(invitationId);
      try {
        await api.invitations.reject(invitationId);
        toast.success('Invitation declined');
        options.onDeclined?.();
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to decline invitation';
        toast.error(message);
      } finally {
        setDecliningId(null);
      }
    },
    [options],
  );

  return {
    joinConsent,
    acceptInvitation,
    declineInvitation,
    decliningId,
    isBusy: (invitationId: string) =>
      decliningId === invitationId || joinConsent.confirming,
  };
}

export function communityInvitationInfo(
  community: Pick<CommunitySummary, 'id' | 'name' | 'logoUrl'>,
): InvitationCommunityInfo {
  return {
    communityId: community.id,
    communityName: community.name,
    logoUrl: community.logoUrl,
  };
}
