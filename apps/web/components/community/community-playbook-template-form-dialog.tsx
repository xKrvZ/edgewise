'use client';

import {
  buildPlaybookFlowPayload,
  PlaybookFlowFormDialog,
  templateToFlowFormValues,
} from '@/components/playbooks/playbook-flow-form-dialog';
import { ApiError, api } from '@/lib/api-client';
import type { CommunityPlaybookTemplate } from '@/lib/types';
import { useMemo } from 'react';
import { toast } from 'sonner';

interface CommunityPlaybookTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  template?: CommunityPlaybookTemplate;
  onSaved: () => void;
}

export function CommunityPlaybookTemplateFormDialog({
  open,
  onOpenChange,
  communityId,
  template,
  onSaved,
}: CommunityPlaybookTemplateFormDialogProps) {
  const initialValues = useMemo(() => templateToFlowFormValues(template), [template]);

  async function handleSubmit(values: ReturnType<typeof templateToFlowFormValues>) {
    const payload = buildPlaybookFlowPayload(values, 'template');
    try {
      if (template) {
        await api.communities.updatePlaybookTemplate(communityId, template.id, payload);
        toast.success('Template updated');
      } else {
        await api.communities.createPlaybookTemplate(communityId, payload);
        toast.success('Template created');
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save template');
      throw err;
    }
  }

  return (
    <PlaybookFlowFormDialog
      mode="template"
      open={open}
      onOpenChange={onOpenChange}
      initialValues={initialValues}
      resetKey={template?.id ?? 'new'}
      title={template ? 'Edit template' : 'New playbook template'}
      description="Define a full setup flow that members can clone into their personal playbooks."
      isEditing={Boolean(template)}
      createLabel="Create template"
      updateLabel="Save changes"
      onSubmit={handleSubmit}
    />
  );
}
