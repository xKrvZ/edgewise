'use client';

import { CommunityPlaybookCloneDialog } from '@/components/community/community-playbook-clone-dialog';
import { CommunityPlaybookTemplateFormDialog } from '@/components/community/community-playbook-template-form-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ApiError, api } from '@/lib/api-client';
import type {
  CommunityMemberRole,
  CommunityPlaybookTemplate,
  CommunityPlaybookTemplateVisibility,
} from '@/lib/types';
import { BookOpen, Copy, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const MENTOR_ROLES: CommunityMemberRole[] = ['owner', 'mentor'];

const VISIBILITY_LABELS: Record<CommunityPlaybookTemplateVisibility, string> = {
  public: 'Public',
  members_only: 'Members only',
};

function countFlowSections(template: CommunityPlaybookTemplate): number {
  let count = 0;
  if (template.marketConditions || template.entryCriteria || template.exitCriteria) count++;
  if (template.riskRules || template.invalidationRules) count++;
  if (template.checklist.length > 0) count++;
  return count;
}

interface CommunityPlaybookTemplateListProps {
  communityId: string;
  templates: CommunityPlaybookTemplate[];
  myRole: CommunityMemberRole | null;
  onChanged: () => void;
}

export function CommunityPlaybookTemplateList({
  communityId,
  templates,
  myRole,
  onChanged,
}: CommunityPlaybookTemplateListProps) {
  const isMember = myRole !== null;
  const canManage = myRole !== null && MENTOR_ROLES.includes(myRole);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CommunityPlaybookTemplate | undefined>();
  const [deleting, setDeleting] = useState<CommunityPlaybookTemplate | undefined>();
  const [duplicateWarning, setDuplicateWarning] = useState<
    CommunityPlaybookTemplate | undefined
  >();
  const [cloning, setCloning] = useState<CommunityPlaybookTemplate | undefined>();
  const [deletingBusy, setDeletingBusy] = useState(false);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(template: CommunityPlaybookTemplate) {
    setEditing(template);
    setFormOpen(true);
  }

  function openClone(template: CommunityPlaybookTemplate) {
    if (template.alreadyCloned) {
      setDuplicateWarning(template);
      return;
    }
    setCloning(template);
  }

  function confirmCloneAgain() {
    if (!duplicateWarning) return;
    setCloning(duplicateWarning);
    setDuplicateWarning(undefined);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await api.communities.removePlaybookTemplate(communityId, deleting.id);
      toast.success(`Removed "${deleting.name}"`);
      setDeleting(undefined);
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete template');
    } finally {
      setDeletingBusy(false);
    }
  }

  if (templates.length === 0) {
    return (
      <>
        <EmptyState
          icon={BookOpen}
          title="No playbook templates yet"
          message={
            canManage
              ? 'Create reusable setup templates that members can clone into their own playbooks.'
              : isMember
                ? 'Templates from mentors and owners will appear here.'
                : 'Public templates from this community will appear here.'
          }
          action={
            canManage ? (
              <Button type="button" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                New template
              </Button>
            ) : undefined
          }
        />
        <CommunityPlaybookTemplateFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          communityId={communityId}
          template={editing}
          onSaved={onChanged}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {canManage ? (
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New template
            </Button>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="flex h-full flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{template.name}</CardTitle>
                  <Badge variant={template.visibility === 'public' ? 'secondary' : 'outline'}>
                    {VISIBILITY_LABELS[template.visibility]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {template.description || 'No description.'}
                </p>
                {countFlowSections(template) > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {[
                      template.marketConditions || template.entryCriteria || template.exitCriteria
                        ? 'Setup'
                        : null,
                      template.riskRules || template.invalidationRules ? 'Risk' : null,
                      template.checklist.length > 0
                        ? `${template.checklist.length} checklist item${template.checklist.length === 1 ? '' : 's'}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No flow details yet</p>
                )}
                {template.checklist.length > 0 ? (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {template.checklist.slice(0, 3).map((item) => (
                      <li key={item.id} className="truncate">
                        • {item.text}
                      </li>
                    ))}
                    {template.checklist.length > 3 ? (
                      <li className="text-xs">+{template.checklist.length - 3} more items</li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No checklist items</p>
                )}

                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  {isMember ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      onClick={() => openClone(template)}
                    >
                      <Copy className="h-4 w-4" />
                      Clone to my playbooks
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Join the community to clone this template.
                    </p>
                  )}
                  {canManage ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(template)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleting(template)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <CommunityPlaybookTemplateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        communityId={communityId}
        template={editing}
        onSaved={onChanged}
      />

      <CommunityPlaybookCloneDialog
        open={Boolean(cloning)}
        onOpenChange={(open) => !open && setCloning(undefined)}
        communityId={communityId}
        template={cloning ?? null}
        onCloned={onChanged}
      />

      <Dialog
        open={Boolean(duplicateWarning)}
        onOpenChange={(open) => !open && setDuplicateWarning(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Already in your journal</DialogTitle>
            <DialogDescription>
              This playbook has already been added to your journal. Would you like to add it again?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDuplicateWarning(undefined)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmCloneAgain}>
              Add again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleting?.name}&rdquo; will be removed from the community. Members who already
              cloned it keep their personal copies.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleting(undefined)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={deletingBusy} onClick={confirmDelete}>
              {deletingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
