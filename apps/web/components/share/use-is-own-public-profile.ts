'use client';

import { useSession } from '@/lib/auth-client';
import { api } from '@/lib/api-client';
import { useEffect, useState } from 'react';

export function useIsOwnPublicProfile(profileToken: string) {
  const { data: session, isPending: sessionPending } = useSession();
  const [isOwner, setIsOwner] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (sessionPending) {
      return;
    }

    if (!session?.user) {
      setIsOwner(false);
      setChecked(true);
      return;
    }

    let cancelled = false;

    api.profile
      .get()
      .then((profile) => {
        if (!cancelled) {
          setIsOwner(profile.statsShareToken === profileToken);
          setChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsOwner(false);
          setChecked(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [profileToken, session?.user, sessionPending]);

  return {
    isOwner,
    isChecking: sessionPending || !checked,
  };
}
