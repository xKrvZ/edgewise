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
import { Stepper } from '@/components/ui/stepper';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, api } from '@/lib/api-client';
import { useWizard } from '@/lib/hooks/use-wizard';
import type { CreatePlaybookInput, Playbook } from '@/lib/types';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PlaybookFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playbook?: Playbook;
  onSaved?: (playbook: Playbook) => void;
}

interface FormState {
  name: string;
  description: string;
  marketConditions: string;
  entryCriteria: string;
  exitCriteria: string;
  riskRules: string;
  invalidationRules: string;
}

const STEPS = [
  { id: 'overview', label: 'Overview' },
  { id: 'setup', label: 'Setup' },
  { id: 'risk', label: 'Risk' },
  { id: 'review', label: 'Review' },
];

function initial(playbook?: Playbook): FormState {
  return {
    name: playbook?.name ?? '',
    description: playbook?.description ?? '',
    marketConditions: playbook?.marketConditions ?? '',
    entryCriteria: playbook?.entryCriteria ?? '',
    exitCriteria: playbook?.exitCriteria ?? '',
    riskRules: playbook?.riskRules ?? '',
    invalidationRules: playbook?.invalidationRules ?? '',
  };
}

export function PlaybookFormDialog({
  open,
  onOpenChange,
  playbook,
  onSaved,
}: PlaybookFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => initial(playbook));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial(playbook));
  }, [open, playbook]);

  const nameValid = Boolean(form.name.trim());

  const wizard = useWizard(STEPS, {
    resetKey: open ? (playbook?.id ?? 'new') : null,
    stepValidity: [nameValid, true, true, true],
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!nameValid) {
      toast.error('Name is required');
      wizard.goTo(0);
      return;
    }
    const payload: CreatePlaybookInput = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      marketConditions: form.marketConditions.trim() || undefined,
      entryCriteria: form.entryCriteria.trim() || undefined,
      exitCriteria: form.exitCriteria.trim() || undefined,
      riskRules: form.riskRules.trim() || undefined,
      invalidationRules: form.invalidationRules.trim() || undefined,
    };
    setSaving(true);
    try {
      const saved = playbook
        ? await api.playbooks.update(playbook.id, payload)
        : await api.playbooks.create(payload);
      toast.success(playbook ? 'Playbook updated' : 'Playbook created');
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save playbook');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-4 border-b px-6 py-4">
          <div className="space-y-1.5 text-left">
            <DialogTitle>{playbook ? 'Edit playbook' : 'New playbook'}</DialogTitle>
            <DialogDescription>
              Define the rules for a setup so you can track adherence over time.
            </DialogDescription>
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
                  onChange={(v) => set('description', v)}
                  placeholder="A short summary of when and why you take this setup."
                  rows={4}
                />
              </>
            )}

            {wizard.current === 1 && (
              <>
                <Area
                  label="Market conditions"
                  value={form.marketConditions}
                  onChange={(v) => set('marketConditions', v)}
                  placeholder="Trending market, high relative volume…"
                />
                <Area
                  label="Entry criteria"
                  value={form.entryCriteria}
                  onChange={(v) => set('entryCriteria', v)}
                  placeholder="The exact conditions that trigger an entry."
                />
                <Area
                  label="Exit criteria"
                  value={form.exitCriteria}
                  onChange={(v) => set('exitCriteria', v)}
                  placeholder="Where and how you take profits."
                />
              </>
            )}

            {wizard.current === 2 && (
              <>
                <Area
                  label="Risk rules"
                  value={form.riskRules}
                  onChange={(v) => set('riskRules', v)}
                  placeholder="Risk 1% per trade, max 3 trades/day…"
                />
                <Area
                  label="Invalidation rules"
                  value={form.invalidationRules}
                  onChange={(v) => set('invalidationRules', v)}
                  placeholder="What tells you the idea is wrong and you should be flat."
                />
              </>
            )}

            {wizard.current === 3 && (
              <div className="space-y-4">
                <ReviewBlock label="Name" value={form.name.trim() || '—'} />
                <ReviewBlock label="Description" value={form.description} />
                <ReviewBlock label="Market conditions" value={form.marketConditions} />
                <ReviewBlock label="Entry criteria" value={form.entryCriteria} />
                <ReviewBlock label="Exit criteria" value={form.exitCriteria} />
                <ReviewBlock label="Risk rules" value={form.riskRules} />
                <ReviewBlock label="Invalidation rules" value={form.invalidationRules} />
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
              {saving ? 'Saving…' : playbook ? 'Save changes' : 'Create playbook'}
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

function ReviewBlock({ label, value }: { label: string; value: string }) {
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
