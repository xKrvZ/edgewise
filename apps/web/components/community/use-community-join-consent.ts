'use client';

import type { CommunityJoinConsentInfo } from '@/components/community/community-join-consent-dialog';
import { AnalyticsEvents, captureActivationMilestone } from '@/lib/posthog';
import { useCallback, useRef, useState } from 'react';

interface OpenConsentOptions {
  confirmLabel?: string;
}

export function useCommunityJoinConsent() {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<CommunityJoinConsentInfo | null>(null);
  const [confirmLabel, setConfirmLabel] = useState('Accept and join');
  const [confirming, setConfirming] = useState(false);
  const confirmActionRef = useRef<(() => Promise<void>) | null>(null);

  const openConsent = useCallback(
    (
      community: CommunityJoinConsentInfo,
      onConfirm: () => Promise<void>,
      options?: OpenConsentOptions,
    ) => {
      setTarget(community);
      confirmActionRef.current = onConfirm;
      setConfirmLabel(options?.confirmLabel ?? 'Accept and join');
      setOpen(true);
    },
    [],
  );

  const handleConfirm = useCallback(async () => {
    const action = confirmActionRef.current;
    if (!action) {
      return;
    }

    setConfirming(true);
    try {
      await action();
      if (target) {
        captureActivationMilestone(AnalyticsEvents.COMMUNITY_JOINED, {
          community_id: target.communityId,
          community_name: target.communityName,
        });
      }
      setOpen(false);
    } finally {
      setConfirming(false);
    }
  }, [target]);

  return {
    open,
    setOpen,
    target,
    confirmLabel,
    confirming,
    openConsent,
    handleConfirm,
  };
}
