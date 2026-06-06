'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError, api } from '@/lib/api-client';
import type { CommunityInvitation } from '@/lib/types';
import { Check, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PendingInvitationsProps {
  invitations: CommunityInvitation[];
  onChanged: () => void;
}

export function PendingInvitations({ invitations, onChanged }: PendingInvitationsProps) {
  const [actingId, setActingId] = useState<string | null>(null);

  if (invitations.length === 0) {
    return null;
  }

  async function accept(id: string) {
    setActingId(id);
    try {
      await api.invitations.accept(id);
      toast.success('Invitation accepted');
      onChanged();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to accept invitation';
      toast.error(message);
    } finally {
      setActingId(null);
    }
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

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pending invitations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.map((inv) => {
          const busy = actingId === inv.id;
          return (
            <div
              key={inv.id}
              className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{inv.communityName}</p>
                <p className="text-sm text-muted-foreground">
                  Invited as{' '}
                  <Badge variant="outline" className="ml-1 capitalize">
                    {inv.role}
                  </Badge>
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => accept(inv.id)} disabled={busy}>
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => reject(inv.id)} disabled={busy}>
                  <X className="h-4 w-4" />
                  Decline
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
