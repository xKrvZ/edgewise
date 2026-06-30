'use client';

import { useCommunityDetail } from '@/components/community/community-detail-context';
import { CommunityPostForm } from '@/components/community/community-post-form';
import { DetailBackLink } from '@/components/shared/detail-back-link';
import { PageBody } from '@/components/shared/page-body';
import type { CommunityMemberRole } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const MENTOR_ROLES: CommunityMemberRole[] = ['owner', 'mentor'];

export default function CommunityNewPostPage() {
  const { community } = useCommunityDetail();
  const router = useRouter();
  const canCreate = community.myRole !== null && MENTOR_ROLES.includes(community.myRole);

  useEffect(() => {
    if (!canCreate) {
      router.replace(`/community/${community.id}/posts`);
    }
  }, [canCreate, community.id, router]);

  if (!canCreate) {
    return null;
  }

  return (
    <PageBody>
      <DetailBackLink href={`/community/${community.id}/posts`} label="Posts" />
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-lg font-semibold text-foreground">New post</h1>
        <CommunityPostForm communityId={community.id} />
      </div>
    </PageBody>
  );
}
