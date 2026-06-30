'use client';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import type { CommunityBannedMember } from '@/lib/types';
import { Ban } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CommunityBannedMembersSectionProps {
  communityId: string;
  onChanged?: () => void;
}

export function CommunityBannedMembersSection({
  communityId,
  onChanged,
}: CommunityBannedMembersSectionProps) {
  const bansQuery = useQuery(() => api.communities.listBans(communityId), [communityId]);
  const bans = bansQuery.data ?? [];
  const [unbanTarget, setUnbanTarget] = useState<CommunityBannedMember | null>(null);

  async function handleUnban() {
    if (!unbanTarget) {
      return;
    }

    try {
      await api.communities.unbanMember(communityId, unbanTarget.userId);
      toast.success(`${unbanTarget.displayName} can rejoin the community`);
      bansQuery.refetch();
      onChanged?.();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to unban member';
      toast.error(message);
      throw err;
    }
  }

  return (
    <>
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Banned members</CardTitle>
          <CardDescription>
            Banned users are removed from the community and cannot rejoin until you unban them.
            Kicked members are not listed here and may rejoin freely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bansQuery.isLoading && bans.length === 0 ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          ) : bans.length === 0 ? (
            <EmptyState
              variant="embedded"
              icon={Ban}
              title="No banned members"
              message="When you ban someone, they appear here so you can unban them later."
            />
          ) : (
            <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
              {bans.map((ban) => (
                <li
                  key={ban.id}
                  className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      name={ban.displayName}
                      avatarUrl={ban.avatarUrl}
                      className="h-10 w-10 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{ban.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        Banned {formatBanDate(ban.bannedAt)} by {ban.bannedByDisplayName}
                        {ban.reason ? ` · ${ban.reason}` : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 self-start sm:self-auto"
                    onClick={() => setUnbanTarget(ban)}
                  >
                    Unban
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={unbanTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setUnbanTarget(null);
          }
        }}
        title={`Unban ${unbanTarget?.displayName ?? 'member'}?`}
        description="They will be able to join this community again using the normal join or invite flow."
        confirmLabel="Unban"
        destructive={false}
        onConfirm={handleUnban}
      />
    </>
  );
}

function formatBanDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
