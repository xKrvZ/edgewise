'use client';

import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PageBody } from '@/components/shared/page-body';
import { Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <PageBody>
      <PageHeader
        eyebrow="Administration"
        title="Admin settings"
        description="Platform configuration and feature flags."
        className="border-none pb-0"
      />

      <EmptyState
        icon={Settings}
        title="Admin settings"
        message="Platform-wide configuration, feature flags, and maintenance controls will live here."
      />
    </PageBody>
  );
}
