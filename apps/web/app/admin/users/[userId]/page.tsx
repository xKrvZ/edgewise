'use client';

import { AdminUserDetailPanel } from '@/components/admin/admin-user-detail-panel';
import { PageHeader } from '@/components/app/page-header';
import { PageBody } from '@/components/shared/page-body';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

interface AdminUserDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const { userId } = use(params);

  return (
    <PageBody>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
            Back to users
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Administration"
        title="User details"
        description="Manage role, subscription, and account status."
        className="border-none pb-0"
      />

      <AdminUserDetailPanel userId={userId} />
    </PageBody>
  );
}
