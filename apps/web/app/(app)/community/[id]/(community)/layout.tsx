'use client';

import { useCommunityDetail } from '@/components/community/community-detail-context';
import { CommunityPageHeader } from '@/components/community/community-page-header';
import { CommunityTabNav } from '@/components/community/community-tab-nav';
import { DetailBackLink } from '@/components/shared/detail-back-link';
import { PageBody } from '@/components/shared/page-body';
import { useParams } from 'next/navigation';

export default function CommunityShellLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { community, refreshCommunity } = useCommunityDetail();
  const canEditBranding = community.myRole === 'owner';

  return (
    <PageBody>
      <DetailBackLink href="/community" label="Communities" />

      <CommunityPageHeader
        community={community}
        canEditBranding={canEditBranding}
        onUpdated={refreshCommunity}
      />

      <CommunityTabNav
        communityId={id}
        myRole={community.myRole}
        leaderboardVisibility={community.leaderboardVisibility ?? 'mentors'}
      />

      <div className="pt-6">{children}</div>
    </PageBody>
  );
}
