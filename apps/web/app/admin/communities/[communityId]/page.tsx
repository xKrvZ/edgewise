'use client';

import { AdminCommunityDetailPanel } from '@/components/admin/admin-community-detail-panel';
import { PageHeader } from '@/components/app/page-header';
import { PageBody } from '@/components/shared/page-body';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

interface AdminCommunityDetailPageProps {
  params: Promise<{ communityId: string }>;
}

export default function AdminCommunityDetailPage({ params }: AdminCommunityDetailPageProps) {
  const { communityId } = use(params);

  return (
    <PageBody>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/admin/communities">
            <ArrowLeft className="h-4 w-4" />
            Back to communities
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Administration"
        title="Community details"
        description="Manage discover visibility and moderate posts."
        className="border-none pb-0"
      />

      <AdminCommunityDetailPanel communityId={communityId} />
    </PageBody>
  );
}
