'use client';

import { api } from '@/lib/api-client';
import { useSession } from '@/lib/auth-client';
import { useQuery } from '@/lib/hooks/use-query';
import {
  resolveUserDisplayLabel,
  userInitials,
  type UserDisplayFields,
} from '@/lib/user-display';

export function useUserDisplayFields(): UserDisplayFields & { isPending: boolean } {
  const { data: session, isPending: sessionPending } = useSession();
  const userId = session?.user?.id;

  const { data: profile, isLoading: profileLoading } = useQuery(
    () => (userId ? api.profile.get() : Promise.resolve(null)),
    [userId],
  );

  return {
    displayName: profile?.displayName,
    name: session?.user?.name,
    email: session?.user?.email,
    isPending: sessionPending || (Boolean(userId) && profileLoading),
  };
}

export function useUserDisplayLabel(): {
  label: string;
  initials: string;
  fields: UserDisplayFields;
  isPending: boolean;
} {
  const fields = useUserDisplayFields();
  const { isPending, ...displayFields } = fields;

  return {
    label: resolveUserDisplayLabel(displayFields),
    initials: userInitials(displayFields),
    fields: displayFields,
    isPending,
  };
}
