'use client';

import { useCommunityDetail } from '@/components/community/community-detail-context';
import { CommunityPlaybookTemplateList } from '@/components/community/community-playbook-template-list';
import { ErrorState } from '@/components/shared/error-state';
import { ListSection } from '@/components/shared/list-section';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';

export default function CommunityPlaybooksPage() {
  const { community } = useCommunityDetail();

  const templatesQuery = useQuery(
    () => api.communities.listPlaybookTemplates(community.id),
    [community.id],
  );
  const templates = templatesQuery.data ?? [];

  return (
    <ListSection
      title="Playbook templates"
      countLabel={templates.length > 0 ? `${templates.length} total` : undefined}
    >
      {templatesQuery.error ? (
        <ErrorState title="Failed to load templates" onRetry={templatesQuery.refetch} />
      ) : templatesQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : (
        <CommunityPlaybookTemplateList
          communityId={community.id}
          templates={templates}
          myRole={community.myRole}
          onChanged={templatesQuery.refetch}
        />
      )}
    </ListSection>
  );
}
