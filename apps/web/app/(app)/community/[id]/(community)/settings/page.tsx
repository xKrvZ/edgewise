'use client';

import { useCommunityDetail } from '@/components/community/community-detail-context';
import { CommunityOwnerMembershipSection } from '@/components/community/community-owner-membership-section';
import { CommunitySettingsForm } from '@/components/community/community-settings-form';
import { CommunityTagManager } from '@/components/community/community-tag-manager';
import { ListSection } from '@/components/shared/list-section';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CommunitySettingsPage() {
  const { community, refreshCommunity } = useCommunityDetail();
  const router = useRouter();
  const isOwner = community.myRole === 'owner';

  useEffect(() => {
    if (!isOwner) {
      router.replace(`/community/${community.id}`);
    }
  }, [isOwner, community.id, router]);

  const tagsQuery = useQuery(
    () => api.communities.listTags(community.id),
    [community.id],
    { enabled: isOwner },
  );
  const tags = tagsQuery.data ?? [];

  if (!isOwner) {
    return null;
  }

  return (
    <ListSection title="Settings">
      <div className="space-y-6">
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
      </div>
    </ListSection>
  );
}
