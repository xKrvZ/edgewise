'use client';

import { CreateCommunityDialog } from '@/components/community/create-community-dialog';
import { Button } from '@/components/ui/button';
import { canCreateCommunity } from '@/lib/billing-plans';
import { useSubscription } from '@/lib/hooks/use-subscription';
import type { CommunityDetail } from '@/lib/types';
import { Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface CreateCommunityCtaProps {
  variant?: 'default' | 'outline';
  onCreated?: (community: CommunityDetail) => void;
}

export function CreateCommunityCta({ variant = 'default', onCreated }: CreateCommunityCtaProps) {
  const [open, setOpen] = useState(false);
  const { status, isLoading } = useSubscription();
  const allowed = canCreateCommunity(status?.planId);

  if (isLoading) {
    return (
      <Button variant={variant} disabled>
        <Plus className="h-4 w-4" />
        New community
      </Button>
    );
  }

  if (!allowed) {
    return (
      <Button variant="outline" asChild>
        <Link href="/account#billing">
          <Sparkles className="h-4 w-4" />
          Upgrade to Elite to create
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New community
      </Button>
      <CreateCommunityDialog open={open} onOpenChange={setOpen} onCreated={onCreated} />
    </>
  );
}
