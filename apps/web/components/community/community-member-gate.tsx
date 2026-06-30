'use client';



import { useCommunityDetail } from '@/components/community/community-detail-context';

import { CommunityJoinConsentDialog } from '@/components/community/community-join-consent-dialog';

import { useCommunityJoinConsent } from '@/components/community/use-community-join-consent';

import {

  communityInvitationInfo,

  useCommunityInvitationActions,

} from '@/components/community/use-community-invitation-actions';

import { EmptyState } from '@/components/shared/empty-state';

import { Button } from '@/components/ui/button';

import { ApiError, api } from '@/lib/api-client';

import { Loader2, Lock, X } from 'lucide-react';

import { toast } from 'sonner';



interface CommunityMemberGateProps {

  children?: React.ReactNode;

  feature?: 'default' | 'leaderboard';

}



export function CommunityMemberGate({ children, feature = 'default' }: CommunityMemberGateProps) {

  const { community, refreshCommunity } = useCommunityDetail();

  const isMember = community.myRole !== null;

  const joinConsent = useCommunityJoinConsent();

  const invitationActions = useCommunityInvitationActions({

    onAccepted: refreshCommunity,

    onDeclined: refreshCommunity,

  });

  const pendingInvitation = community.pendingInvitation;



  if (isMember) {

    return children ?? null;

  }



  function handleJoinClick() {

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

          refreshCommunity();

        } catch (err) {

          const message = err instanceof ApiError ? err.message : 'Failed to join community';

          toast.error(message);

          throw err;

        }

      },

    );

  }



  const isInviteOnly = community.joinPolicy === 'invite_only';



  const message =

    feature === 'leaderboard'

      ? pendingInvitation

        ? 'Accept your invitation to join this community and view the leaderboard.'

        : isInviteOnly

          ? 'You need an invitation to join this community and view the leaderboard.'

          : 'Join this community to view the leaderboard.'

      : pendingInvitation

        ? 'Accept your invitation to join this community and access this section.'

        : isInviteOnly

          ? 'You need an invitation to join this community and access this section.'

          : 'Join this community to access posts, members, and the leaderboard.';



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

      <EmptyState

        icon={Lock}

        title="Members only"

        message={message}

        action={

          pendingInvitation ? (

            <div className="flex flex-wrap justify-center gap-2">

              <Button

                variant="success"

                onClick={() =>

                  invitationActions.acceptInvitation(

                    pendingInvitation,

                    communityInvitationInfo(community),

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

                variant="destructive"

                onClick={() => void invitationActions.declineInvitation(pendingInvitation.id)}

                disabled={invitationActions.isBusy(pendingInvitation.id)}

              >

                <X className="h-4 w-4" />

                Decline

              </Button>

            </div>

          ) : isInviteOnly ? undefined : (

            <Button onClick={handleJoinClick} disabled={joinConsent.confirming}>

              {joinConsent.confirming && <Loader2 className="h-4 w-4 animate-spin" />}

              Join community

            </Button>

          )

        }

      />

    </>

  );

}

