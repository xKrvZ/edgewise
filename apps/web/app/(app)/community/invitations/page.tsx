'use client';

import { PendingInvitations } from '@/components/community/pending-invitations';
import { useCommunityListContext } from '@/components/community/community-list-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function CommunityInvitationsPage() {
  const { invitations, isLoading, refetchAll } = useCommunityListContext();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {(['a', 'b'] as const).map((key) => (
          <Skeleton key={key} className="h-24 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <PendingInvitations embedded invitations={invitations} onChanged={refetchAll} />
  );
}
