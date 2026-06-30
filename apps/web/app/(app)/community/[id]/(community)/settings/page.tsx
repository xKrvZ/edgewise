'use client';

import { useCommunityDetail } from '@/components/community/community-detail-context';
import { CommunityBannedMembersSection } from '@/components/community/community-banned-members-section';
import { CommunityOwnerMembershipSection } from '@/components/community/community-owner-membership-section';
import { CommunitySettingsForm } from '@/components/community/community-settings-form';
import { CommunityTagManager } from '@/components/community/community-tag-manager';
import { ListSection } from '@/components/shared/list-section';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { CommunityMemberRole } from '@/lib/types';

const MODERATOR_ROLES: CommunityMemberRole[] = ['owner', 'mentor'];

export default function CommunitySettingsPage() {
  const { community, refreshCommunity } = useCommunityDetail();
  const router = useRouter();
  const myRole = community.myRole;
  const isOwner = myRole === 'owner';
  const canModerate = myRole !== null && MODERATOR_ROLES.includes(myRole);

  useEffect(() => {
    if (!canModerate) {
      router.replace(`/community/${community.id}`);
    }
  }, [canModerate, community.id, router]);

  const tagsQuery = useQuery(
    () => api.communities.listTags(community.id),
    [community.id],
    { enabled: isOwner },
  );
  const tags = tagsQuery.data ?? [];

  if (!canModerate) {
    return null;
  }

  return (
    <ListSection title="Settings">
      <div className="space-y-6">
        {isOwner ? (
          <>
            <CommunitySettingsForm community={community} onSaved={refreshCommunity} />
            <CommunityTagManager
              communityId={community.id}
              tags={tags}
              onChanged={() => {
                tagsQuery.refetch();
                refreshCommunity();
              }}
            />
            <CommunityOwnerMembershipSection />
          </>
        ) : null}
        <CommunityBannedMembersSection
          communityId={community.id}
          onChanged={refreshCommunity}
        />
      </div>
    </ListSection>
  );
}
