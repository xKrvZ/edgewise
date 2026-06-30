'use client';

import { ProfileSettingsForm } from '@/components/app/profile-settings-form';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';

function ProfileLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <Skeleton className="h-80 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

export function AccountSectionProfile() {
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery(() => api.profile.get(), []);

  const { data: playbooks } = useQuery(() => api.playbooks.list(), []);
  const { data: accounts } = useQuery(() => api.accounts.list(), []);

  if (profileError) {
    return (
      <ErrorState
        title="Could not load profile"
        message="We couldn't load your profile settings. Please try again."
        onRetry={refetchProfile}
      />
    );
  }

  if (profileLoading || !profile) {
    return <ProfileLoadingSkeleton />;
  }

  return (
    <ProfileSettingsForm
      profile={profile}
      playbooks={playbooks ?? []}
      accounts={accounts ?? []}
      onSaved={refetchProfile}
    />
  );
}
