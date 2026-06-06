'use client';

import { PageHeader } from '@/components/app/page-header';
import { ProfileSettingsForm } from '@/components/app/profile-settings-form';
import { ErrorState } from '@/components/shared/error-state';
import { PageBody } from '@/components/shared/page-body';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';

function ProfileLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <Skeleton className="h-36 w-full rounded-none rounded-t-xl" />
        <CardContent className="space-y-4 pt-0">
          <Skeleton className="-mt-10 h-20 w-20 rounded-full" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

export default function ProfilePage() {
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery(() => api.profile.get(), []);

  const { data: playbooks, isLoading: playbooksLoading } = useQuery(
    () => api.playbooks.list(),
    [],
  );

  const isLoading = profileLoading || playbooksLoading;

  return (
    <PageBody>
      <PageHeader
        title="Profile"
        description="Customize your public trader profile — avatar, banner, bio, favorite symbols, and optional stats or playbook sharing."
        eyebrow="Public presence"
      />

      {profileError ? (
        <ErrorState
          title="Could not load profile"
          message="We couldn't load your profile settings. Please try again."
          onRetry={refetchProfile}
        />
      ) : isLoading || !profile ? (
        <ProfileLoadingSkeleton />
      ) : (
        <ProfileSettingsForm
          profile={profile}
          playbooks={playbooks ?? []}
          onSaved={refetchProfile}
        />
      )}
    </PageBody>
  );
}
