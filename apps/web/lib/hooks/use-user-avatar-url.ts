'use client';

import { api } from '@/lib/api-client';
import { useSession } from '@/lib/auth-client';
import { useQuery } from '@/lib/hooks/use-query';
import { userAvatarUrl } from '@/lib/user-display';

export function useUserAvatarUrl(): string | undefined {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: profile } = useQuery(
    () => (userId ? api.profile.get() : Promise.resolve(null)),
    [userId],
  );

  return userAvatarUrl({
    image: session?.user?.image,
    avatarUrl: profile?.avatarUrl,
  });
}
