'use client';

import {
  buildPlaybookFlowPayload,
  PlaybookFlowFormDialog,
  playbookToFlowFormValues,
} from '@/components/playbooks/playbook-flow-form-dialog';
import { ApiError, api } from '@/lib/api-client';
import type { CreatePlaybookInput, Playbook } from '@/lib/types';
import { useMemo } from 'react';
import { toast } from 'sonner';

interface PlaybookFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playbook?: Playbook;
  onSaved?: (playbook: Playbook) => void;
}

export function PlaybookFormDialog({
  open,
  onOpenChange,
  playbook,
  onSaved,
}: PlaybookFormDialogProps) {
  const initialValues = useMemo(() => playbookToFlowFormValues(playbook), [playbook]);

  async function handleSubmit(values: ReturnType<typeof playbookToFlowFormValues>) {
    const payload = buildPlaybookFlowPayload(values, 'playbook') as CreatePlaybookInput;
    try {
      const saved = playbook
        ? await api.playbooks.update(playbook.id, payload)
        : await api.playbooks.create(payload);
      toast.success(playbook ? 'Playbook updated' : 'Playbook created');
      onSaved?.(saved);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save playbook');
      throw err;
    }
  }

  return (
    <PlaybookFlowFormDialog
      mode="playbook"
      open={open}
      onOpenChange={onOpenChange}
      initialValues={initialValues}
      resetKey={playbook?.id ?? 'new'}
      title={playbook ? 'Edit playbook' : 'New playbook'}
      description="Define the rules for a setup so you can track adherence over time."
      isEditing={Boolean(playbook)}
      createLabel="Create playbook"
      updateLabel="Save changes"
      onSubmit={handleSubmit}
    />
  );
}
