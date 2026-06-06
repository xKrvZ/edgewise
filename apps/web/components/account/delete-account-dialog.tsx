'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import { signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const DELETE_CONFIRMATION = 'DELETE';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string | null;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  userEmail,
}: DeleteAccountDialogProps) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    const trimmed = confirmation.trim();
    const emailMatches =
      userEmail && trimmed.toLowerCase() === userEmail.toLowerCase();
    const phraseMatches = trimmed === DELETE_CONFIRMATION;

    if (!emailMatches && !phraseMatches) {
      setError(`Type "${DELETE_CONFIRMATION}" or your email address to confirm.`);
      return;
    }

    setLoading(true);
    try {
      await api.account.delete(trimmed);
      await signOut();
      toast.success('Your account has been deleted.');
      onOpenChange(false);
      router.push('/');
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete account. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>
            This permanently erases your trades, journal, screenshots, and profile data.
            Billing records are retained in anonymized form for reconciliation. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="delete-confirmation">
            Type <span className="font-mono">{DELETE_CONFIRMATION}</span> or your email to confirm
          </Label>
          <Input
            id="delete-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={DELETE_CONFIRMATION}
            autoComplete="off"
            disabled={loading}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting…' : 'Delete account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
