'use client';

import { useCommunityDetail } from '@/components/community/community-detail-context';
import { CommunityMemberGate } from '@/components/community/community-member-gate';
import { CommunityMemberList } from '@/components/community/community-member-list';
import { ListSection } from '@/components/shared/list-section';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';

export default function CommunityMembersPage() {
  const { community, refreshCommunity } = useCommunityDetail();

  const tagsQuery = useQuery(() => api.communities.listTags(community.id), [community.id]);
  const tags = tagsQuery.data ?? [];

  return (
    <CommunityMemberGate>
      <ListSection title="Members" countLabel={`${community.memberCount} total`}>
        <CommunityMemberList
          communityId={community.id}
          myRole={community.myRole!}
          tags={tags}
          tagsLoading={tagsQuery.isLoading}
          onMembersChanged={refreshCommunity}
        />
      </ListSection>
    </CommunityMemberGate>
  );
}
