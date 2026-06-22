'use client';

import { CreateAccountCta } from '@/components/accounts/create-account-cta';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { useActiveAccounts } from '@/lib/hooks/use-active-accounts';
import { LineChart, Plus, Upload, Wallet } from 'lucide-react';

interface TradesEmptyStateProps {
  onImport: () => void;
  onLogTrade: () => void;
}

export function TradesEmptyState({ onImport, onLogTrade }: TradesEmptyStateProps) {
  const { needsAccountFirst, isLoading } = useActiveAccounts();

  if (isLoading) {
    return (
      <EmptyState
        icon={LineChart}
        title="No trades yet"
        message="Log your first trade or import a CSV export from your broker to get started."
      />
    );
  }

  if (needsAccountFirst) {
    return (
      <EmptyState
        icon={Wallet}
        title="Create a journal first"
        message="Add a journal before you can log or import trades."
        action={<CreateAccountCta />}
      />
    );
  }

  return (
    <EmptyState
      icon={LineChart}
      title="No trades yet"
      message="Log your first trade or import a CSV export from your broker to get started."
      action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onImport}>
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={onLogTrade}>
            <Plus className="h-4 w-4" />
            Log trade
          </Button>
        </div>
      }
    />
  );
}
