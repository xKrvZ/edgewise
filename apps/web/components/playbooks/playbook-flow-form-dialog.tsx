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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Stepper } from '@/components/ui/stepper';
import { Textarea } from '@/components/ui/textarea';
import { useWizard } from '@/lib/hooks/use-wizard';
import type {
  CommunityPlaybookTemplate,
  CommunityPlaybookTemplateVisibility,
  Playbook,
} from '@/lib/types';
import { ArrowLeft, ArrowRight, Check, GripVertical, Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export type PlaybookFlowFormMode = 'template' | 'playbook';

export interface PlaybookFlowChecklistItemInput {
  text: string;
  sortOrder?: number;
}

export interface PlaybookFlowFormValues {
  name: string;
  description: string;
  visibility: CommunityPlaybookTemplateVisibility;
  marketConditions: string;
  entryCriteria: string;
  exitCriteria: string;
  riskRules: string;
  invalidationRules: string;
  checklist: PlaybookFlowChecklistItemInput[];
}

const STEPS = [
  { id: 'overview', label: 'Overview' },
  { id: 'setup', label: 'Setup' },
  { id: 'risk', label: 'Risk' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'review', label: 'Review' },
];

export function emptyPlaybookFlowFormValues(): PlaybookFlowFormValues {
  return {
    name: '',
    description: '',
    visibility: 'members_only',
    marketConditions: '',
    entryCriteria: '',
    exitCriteria: '',
    riskRules: '',
    invalidationRules: '',
    checklist: [],
  };
}

export function playbookToFlowFormValues(playbook?: Playbook): PlaybookFlowFormValues {
  return {
    name: playbook?.name ?? '',
    description: playbook?.description ?? '',
    visibility: 'members_only',
    marketConditions: playbook?.marketConditions ?? '',
    entryCriteria: playbook?.entryCriteria ?? '',
    exitCriteria: playbook?.exitCriteria ?? '',
    riskRules: playbook?.riskRules ?? '',
    invalidationRules: playbook?.invalidationRules ?? '',
    checklist:
      playbook?.checklist?.map((item, index) => ({
        text: item.text,
        sortOrder: item.sortOrder ?? index,
      })) ?? [],
  };
}

export function templateToFlowFormValues(
  template?: CommunityPlaybookTemplate,
): PlaybookFlowFormValues {
  return {
    name: template?.name ?? '',
    description: template?.description ?? '',
    visibility: template?.visibility ?? 'members_only',
    marketConditions: template?.marketConditions ?? '',
    entryCriteria: template?.entryCriteria ?? '',
    exitCriteria: template?.exitCriteria ?? '',
    riskRules: template?.riskRules ?? '',
    invalidationRules: template?.invalidationRules ?? '',
    checklist:
      template?.checklist.map((item, index) => ({
        text: item.text,
        sortOrder: item.sortOrder ?? index,
      })) ?? [],
  };
}

export function buildPlaybookFlowPayload(form: PlaybookFlowFormValues, mode: PlaybookFlowFormMode) {
  const base = {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    marketConditions: form.marketConditions.trim() || undefined,
    entryCriteria: form.entryCriteria.trim() || undefined,
    exitCriteria: form.exitCriteria.trim() || undefined,
    riskRules: form.riskRules.trim() || undefined,
    invalidationRules: form.invalidationRules.trim() || undefined,
    checklist: form.checklist.map((item, index) => ({
      text: item.text.trim(),
      sortOrder: index,
    })),
  };

  if (mode === 'template') {
    return { ...base, visibility: form.visibility };
  }

  return base;
}

interface PlaybookFlowFormDialogProps {
  mode: PlaybookFlowFormMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: PlaybookFlowFormValues;
  resetKey?: string | null;
  title: string;
  description: string;
  isEditing: boolean;
  createLabel: string;
  updateLabel: string;
  onSubmit: (values: PlaybookFlowFormValues) => Promise<void>;
}

export function PlaybookFlowFormDialog({
  mode,
  open,
  onOpenChange,
  initialValues,
  resetKey,
  title,
  description,
  isEditing,
  createLabel,
  updateLabel,
  onSubmit,
}: PlaybookFlowFormDialogProps) {
  const [form, setForm] = useState<PlaybookFlowFormValues>(() => initialValues);
  const [newItemText, setNewItemText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialValues);
      setNewItemText('');
    }
  }, [open, initialValues]);

  const nameValid = Boolean(form.name.trim());

  const wizard = useWizard(STEPS, {
    resetKey: open ? (resetKey ?? 'new') : null,
    stepValidity: [nameValid, true, true, true, true],
  });

  function set<K extends keyof PlaybookFlowFormValues>(key: K, value: PlaybookFlowFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addChecklistItem() {
    const text = newItemText.trim();
    if (!text) return;
    setForm((current) => ({
      ...current,
      checklist: [...current.checklist, { text, sortOrder: current.checklist.length }],
    }));
    setNewItemText('');
  }

  function removeChecklistItem(index: number) {
    setForm((current) => ({
      ...current,
      checklist: current.checklist.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit() {
    if (!nameValid) {
      toast.error('Name is required');
      wizard.goTo(0);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  const descriptionPlaceholder =
    mode === 'template'
      ? 'A short summary of when and why to use this setup.'
      : 'A short summary of when and why you take this setup.';

  const exitCriteriaPlaceholder =
    mode === 'template'
      ? 'Where and how to take profits.'
      : 'Where and how you take profits.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-4 border-b px-6 py-4">
          <div className="space-y-1.5 text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
          <Stepper
            steps={STEPS}
            current={wizard.current}
            onStepClick={wizard.goTo}
            isStepComplete={wizard.isStepComplete}
          />
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 px-6 py-5">
            {wizard.current === 0 && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    autoFocus
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Opening range breakout"
                  />
                </div>
                <Area
                  label="Description"
                  value={form.description}
                  onChange={(value) => set('description', value)}
                  placeholder={descriptionPlaceholder}
                  rows={4}
                />
                {mode === 'template' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Visibility</Label>
                    <Select
                      value={form.visibility}
                      onValueChange={(value: CommunityPlaybookTemplateVisibility) =>
                        set('visibility', value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public — visible to everyone browsing</SelectItem>
                        <SelectItem value="members_only">Members only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {wizard.current === 1 && (
              <>
                <Area
                  label="Market conditions"
                  value={form.marketConditions}
                  onChange={(value) => set('marketConditions', value)}
                  placeholder="Trending market, high relative volume…"
                />
                <Area
                  label="Entry criteria"
                  value={form.entryCriteria}
                  onChange={(value) => set('entryCriteria', value)}
                  placeholder="The exact conditions that trigger an entry."
                />
                <Area
                  label="Exit criteria"
                  value={form.exitCriteria}
                  onChange={(value) => set('exitCriteria', value)}
                  placeholder={exitCriteriaPlaceholder}
                />
              </>
            )}

            {wizard.current === 2 && (
              <>
                <Area
                  label="Risk rules"
                  value={form.riskRules}
                  onChange={(value) => set('riskRules', value)}
                  placeholder="Risk 1% per trade, max 3 trades/day…"
                />
                <Area
                  label="Invalidation rules"
                  value={form.invalidationRules}
                  onChange={(value) => set('invalidationRules', value)}
                  placeholder="What tells you the idea is wrong and you should be flat."
                />
              </>
            )}

            {wizard.current === 3 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Checklist items</Label>
                {form.checklist.length === 0 ? (
                  <p className="rounded-md border border-dashed py-3 text-center text-sm text-muted-foreground">
                    Add must-have checks for this setup.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {form.checklist.map((item, index) => (
                      <li
                        key={`${index}-${item.text}`}
                        className="flex items-center gap-2 rounded-md border bg-card/50 px-3 py-2 text-sm"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                        <span className="flex-1">{item.text}</span>
                        <button
                          type="button"
                          onClick={() => removeChecklistItem(index)}
                          className="text-destructive"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addChecklistItem();
                      }
                    }}
                    placeholder="Add a checklist item…"
                  />
                  <Button type="button" variant="outline" onClick={addChecklistItem}>
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            )}

            {wizard.current === 4 && (
              <div className="space-y-4">
                <ReviewBlock label="Name" value={form.name.trim() || '—'} />
                <ReviewBlock label="Description" value={form.description} />
                {mode === 'template' && (
                  <ReviewBlock
                    label="Visibility"
                    value={form.visibility === 'public' ? 'Public' : 'Members only'}
                  />
                )}
                <ReviewBlock label="Market conditions" value={form.marketConditions} />
                <ReviewBlock label="Entry criteria" value={form.entryCriteria} />
                <ReviewBlock label="Exit criteria" value={form.exitCriteria} />
                <ReviewBlock label="Risk rules" value={form.riskRules} />
                <ReviewBlock label="Invalidation rules" value={form.invalidationRules} />
                <ReviewBlock
                  label="Checklist"
                  value={
                    form.checklist.length > 0
                      ? form.checklist.map((item) => `• ${item.text}`).join('\n')
                      : ''
                  }
                />
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row items-center justify-between border-t px-6 py-4 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={wizard.isFirst ? () => onOpenChange(false) : wizard.back}
            disabled={saving}
          >
            {wizard.isFirst ? (
              'Cancel'
            ) : (
              <>
                <ArrowLeft className="h-4 w-4" />
                Back
              </>
            )}
          </Button>
          {wizard.isLast ? (
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {saving ? 'Saving…' : isEditing ? updateLabel : createLabel}
            </Button>
          ) : (
            <Button type="button" onClick={wizard.next} disabled={!wizard.canAdvance}>
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Area({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}

export function ReviewBlock({ label, value }: { label: string; value: string }) {
  const trimmed = value.trim();
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-foreground">
        {trimmed || <span className="text-muted-foreground">Not set</span>}
      </p>
    </div>
  );
}
