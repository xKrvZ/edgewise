'use client';

import { useSession } from '@/lib/auth-client';
import { captureSessionStarted } from '@/lib/posthog';
import { useEffect } from 'react';

/** Emits one session_started event per browser tab session for engagement metrics. */
export function PostHogSession() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) {
      return;
    }

    captureSessionStarted(userId);
  }, [userId]);

  return null;
}
