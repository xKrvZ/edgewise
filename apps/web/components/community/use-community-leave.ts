'use client';

import type { CommunityLeaveConsentInfo } from '@/components/community/community-leave-consent-dialog';
import { ApiError, api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useCommunityLeave() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [community, setCommunity] = useState<CommunityLeaveConsentInfo | null>(null);
  const [leaving, setLeaving] = useState(false);

  const openLeaveDialog = useCallback((target: CommunityLeaveConsentInfo) => {
    setCommunity(target);
    setOpen(true);
  }, []);

  const handleLeave = useCallback(async () => {
    if (!community) {
      return;
    }

    setLeaving(true);
    try {
      await api.communities.leave(community.communityId);
      toast.success(`Left ${community.communityName}`);
      setOpen(false);
      router.push('/community');
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to leave community';
      toast.error(message);
    } finally {
      setLeaving(false);
    }
  }, [community, router]);

  return {
    open,
    setOpen,
    community,
    leaving,
    openLeaveDialog,
    handleLeave,
  };
}
