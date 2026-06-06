'use client';

import { AccountSettingsRow } from '@/components/account/account-settings-row';
import { AccountSettingsSection } from '@/components/account/account-settings-section';
import { ChangePasswordForm } from '@/components/account/change-password-form';
import { DeleteAccountDialog } from '@/components/account/delete-account-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth-client';
import { useUserDisplayLabel } from '@/lib/hooks/use-user-display-label';
import { Key, Mail, Trash2, User } from 'lucide-react';
import { useState } from 'react';

interface AccountSectionAccountProps {
  onGoToProfile?: () => void;
}

export function AccountSectionAccount({ onGoToProfile }: AccountSectionAccountProps) {
  const { data: session, isPending } = useSession();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const user = session?.user;
  const { label: displayName } = useUserDisplayLabel();
  const emailVerified = user?.emailVerified ?? Boolean(user?.email);

  return (
    <div className="space-y-8">
      <AccountSettingsSection title="Details">
        <AccountSettingsRow
          icon={Mail}
          label="E-Mail"
          badge={emailVerified ? { label: 'Verified', variant: 'success' } : undefined}
          value={
            isPending ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              <span className="font-mono text-sm">{user?.email ?? '—'}</span>
            )
          }
          description="Contact support if you need to change your email address."
        />
        <AccountSettingsRow
          icon={User}
          label="Display name"
          value={
            isPending ? <Skeleton className="h-4 w-32" /> : <span>{displayName}</span>
          }
          description="Shown in the app and on your public trader profile."
          actions={
            onGoToProfile ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-[5.5rem] font-semibold tracking-wide uppercase"
                onClick={onGoToProfile}
              >
                Edit
              </Button>
            ) : undefined
          }
        />
      </AccountSettingsSection>

      <AccountSettingsSection title="Security">
        <AccountSettingsRow
          icon={Key}
          label="Password"
          description="Update your password. You will stay signed in on this device."
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-w-[5.5rem] font-semibold tracking-wide uppercase"
              onClick={() => setPasswordOpen(true)}
            >
              Change
            </Button>
          }
        />
        <AccountSettingsRow
          icon={Trash2}
          label="Delete account"
          description="Permanently erase your trading data and anonymize your profile. Billing records are kept for reconciliation."
          actions={
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="min-w-[5.5rem] font-semibold tracking-wide uppercase"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          }
        />
      </AccountSettingsSection>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one. Other sessions will be signed out.
            </DialogDescription>
          </DialogHeader>
          <ChangePasswordForm onSuccess={() => setPasswordOpen(false)} />
        </DialogContent>
      </Dialog>

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        userEmail={user?.email}
      />
    </div>
  );
}
