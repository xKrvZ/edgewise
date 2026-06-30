'use client';

import { CommunityJoinConsentDialog } from '@/components/community/community-join-consent-dialog';
import { useCommunityJoinConsent } from '@/components/community/use-community-join-consent';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError, api } from '@/lib/api-client';
import type { CommunityInvitation } from '@/lib/types';
import { Check, ExternalLink, Loader2, Mail, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

interface PendingInvitationsProps {
  invitations: CommunityInvitation[];
  onChanged: () => void;
  /** Renders without the outer card and shows an empty state when there are no invites. */
  embedded?: boolean;
}

export function PendingInvitations({
  invitations,
  onChanged,
  embedded = false,
}: PendingInvitationsProps) {
  const [actingId, setActingId] = useState<string | null>(null);
  const joinConsent = useCommunityJoinConsent();

  if (invitations.length === 0) {
    if (embedded) {
      return (
        <EmptyState
          icon={Mail}
          title="No pending invitations"
          message="When someone invites you to a community, it will show up here."
        />
      );
    }
    return null;
  }

  function handleAcceptClick(inv: CommunityInvitation) {
    joinConsent.openConsent(
      {
        communityId: inv.communityId,
        communityName: inv.communityName,
        logoUrl: inv.logoUrl,
      },
      async () => {
        setActingId(inv.id);
        try {
          await api.invitations.accept(inv.id);
          toast.success('Invitation accepted');
          onChanged();
        } catch (err) {
          const message = err instanceof ApiError ? err.message : 'Failed to accept invitation';
          toast.error(message);
          throw err;
        } finally {
          setActingId(null);
        }
      },
      { confirmLabel: 'Accept and join' },
    );
  }

  async function reject(id: string) {
    setActingId(id);
    try {
      await api.invitations.reject(id);
      toast.success('Invitation declined');
      onChanged();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to decline invitation';
      toast.error(message);
    } finally {
      setActingId(null);
    }
  }

  const invitationList = (
    <div className="space-y-3">
      {invitations.map((inv) => {
        const busy = actingId === inv.id;

        return (
          <div
            key={inv.id}
            className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium">{inv.communityName}</p>
              <p className="text-sm text-muted-foreground">
                Invited as{' '}
                <Badge variant="outline" className="ml-1 capitalize">
                  {inv.role}
                </Badge>
                {inv.inviterName ? <span className="ml-2">by {inv.inviterName}</span> : null}
              </p>
              <Button
                asChild
                variant="link"
                size="sm"
                className="mt-1 h-auto px-0 text-muted-foreground"
              >
                <Link href={`/community/${inv.communityId}`}>
                  Preview community
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="success"
                onClick={() => handleAcceptClick(inv)}
                disabled={busy || joinConsent.confirming}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Accept
              </Button>
              <Button size="sm" variant="destructive" onClick={() => reject(inv.id)} disabled={busy}>
                <X className="h-4 w-4" />
                Decline
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );

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
      {embedded ? (
        invitationList
      ) : (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending invitations</CardTitle>
          </CardHeader>
          <CardContent>{invitationList}</CardContent>
        </Card>
      )}
    </>
  );
}

