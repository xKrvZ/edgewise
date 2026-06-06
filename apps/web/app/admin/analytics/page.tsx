'use client';

import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PageBody } from '@/components/shared/page-body';
import { BarChart3 } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <PageBody>
      <PageHeader
        eyebrow="Administration"
        title="Platform analytics"
        description="Usage metrics, feature adoption, and engagement trends."
        className="border-none pb-0"
      />

      <EmptyState
        icon={BarChart3}
        title="Platform analytics"
        message="Cross-user analytics and product usage insights are coming soon."
      />
    </PageBody>
  );
}
