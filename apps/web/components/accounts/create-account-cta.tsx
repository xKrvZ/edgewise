'use client';

import { AccountFormDialog } from '@/components/accounts/account-form-dialog';
import { Button } from '@/components/ui/button';
import { useActiveAccounts } from '@/lib/hooks/use-active-accounts';
import { storeUpgradeContext } from '@/lib/posthog';
import { useAccountStore } from '@/stores/account-store';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface CreateAccountCtaProps {
  variant?: 'default' | 'outline';
}

export function CreateAccountCta({ variant = 'default' }: CreateAccountCtaProps) {
  const [open, setOpen] = useState(false);
  const { refetch, activeAccounts } = useActiveAccounts();
  const setSelectedAccountId = useAccountStore((state) => state.setSelectedAccountId);

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Create journal
      </Button>
      <AccountFormDialog
        open={open}
        onOpenChange={setOpen}
        existingAccountCount={activeAccounts.length}
        onSaved={(saved) => {
          refetch();
          setSelectedAccountId(saved.id);
        }}
      />
    </>
  );
}
