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
import { Switch } from '@/components/ui/switch';
import { ApiError, api } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format';
import { useWizard } from '@/lib/hooks/use-wizard';
import {
  AnalyticsEvents,
  captureActivationMilestone,
} from '@/lib/posthog';
import type {
  Account,
  AccountCurrency,
  AccountType,
  ChallengeStatus,
  CreateAccountInput,
} from '@/lib/types';
import { ACCOUNT_CURRENCIES, ACCOUNT_TYPES } from '@/lib/types';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  existingAccountCount?: number;
  onSaved?: (saved: Account) => void;
}

const STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'risk', label: 'Risk limits' },
  { id: 'review', label: 'Review' },
];

const TYPE_LABELS: Record<AccountType, string> = {
  live: 'Live',
  paper: 'Paper',
  prop: 'Prop / funded',
};

const STATUS_LABELS: Record<ChallengeStatus, string> = {
  active: 'Active',
  passed: 'Passed',
  failed: 'Failed',
};

function accountHasRiskLimits(account?: Account): boolean {
  if (!account) return false;
  return (
    account.profitTarget != null ||
    account.dailyLossLimit != null ||
    account.maxLossLimit != null ||
    account.firmName != null ||
    account.challengeStatus != null
  );
}

export function AccountFormDialog({
  open,
  onOpenChange,
  account,
  existingAccountCount = 0,
  onSaved,
}: AccountFormDialogProps) {
  const [name, setName] = useState('');
  const [broker, setBroker] = useState('');
  const [type, setType] = useState<AccountType>('live');
  const [currency, setCurrency] = useState('USD');
  const [startingBalance, setStartingBalance] = useState('0');
  const [currentBalance, setCurrentBalance] = useState('0');
  const [riskLimitsEnabled, setRiskLimitsEnabled] = useState(false);
  const [firmName, setFirmName] = useState('');
  const [profitTarget, setProfitTarget] = useState('');
  const [dailyLossLimit, setDailyLossLimit] = useState('');
  const [maxLossLimit, setMaxLossLimit] = useState('');
  const [trailingDrawdown, setTrailingDrawdown] = useState(false);
  const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus>('active');
  const [challengeStartedAt, setChallengeStartedAt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(account?.name ?? '');
    setBroker(account?.broker ?? '');
    setType(account?.type ?? 'live');
    setCurrency(account?.currency ?? 'USD');
    setStartingBalance(String(account?.startingBalance ?? 0));
    setCurrentBalance(String(account?.currentBalance ?? 0));
    const hasRisk = accountHasRiskLimits(account);
    setRiskLimitsEnabled(hasRisk || account?.type === 'prop');
    setFirmName(account?.firmName ?? '');
    setProfitTarget(account?.profitTarget != null ? String(account.profitTarget) : '');
    setDailyLossLimit(account?.dailyLossLimit != null ? String(account.dailyLossLimit) : '');
    setMaxLossLimit(account?.maxLossLimit != null ? String(account.maxLossLimit) : '');
    setTrailingDrawdown(account?.trailingDrawdown ?? false);
    setChallengeStatus(account?.challengeStatus ?? 'active');
    setChallengeStartedAt(
      account?.challengeStartedAt?.slice(0, 10) ?? format(new Date(), 'yyyy-MM-dd'),
    );
  }, [open, account]);

  const nameValid = Boolean(name.trim());

  const currencyOptions = useMemo(() => {
    const options = [...ACCOUNT_CURRENCIES];
    const existing = account?.currency;
    if (existing && !ACCOUNT_CURRENCIES.includes(existing as AccountCurrency)) {
      return [existing, ...options];
    }
    return options;
  }, [account?.currency]);

  const wizard = useWizard(STEPS, {
    resetKey: open ? (account?.id ?? 'new') : null,
    stepValidity: [nameValid, true, true],
  });

  function parseOptionalNumber(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }

  async function handleSubmit() {
    if (!nameValid) {
      toast.error('Journal name is required');
      wizard.goTo(0);
      return;
    }

    if (!ACCOUNT_CURRENCIES.includes(currency as AccountCurrency)) {
      toast.error('Choose a supported currency');
      wizard.goTo(0);
      return;
    }

    const payload: CreateAccountInput = {
      name: name.trim(),
      broker: broker.trim() || undefined,
      type,
      currency,
      startingBalance: Number(startingBalance) || 0,
      currentBalance: Number(currentBalance) || Number(startingBalance) || 0,
      firmName: riskLimitsEnabled ? firmName.trim() || null : null,
      profitTarget: riskLimitsEnabled ? parseOptionalNumber(profitTarget) : null,
      dailyLossLimit: riskLimitsEnabled ? parseOptionalNumber(dailyLossLimit) : null,
      maxLossLimit: riskLimitsEnabled ? parseOptionalNumber(maxLossLimit) : null,
      trailingDrawdown: riskLimitsEnabled ? trailingDrawdown : false,
      challengeStatus: riskLimitsEnabled ? challengeStatus : null,
      challengeStartedAt:
        riskLimitsEnabled && challengeStartedAt ? new Date(challengeStartedAt).toISOString() : null,
    };

    setSaving(true);
    try {
      const saved = account
        ? await api.accounts.update(account.id, payload)
        : await api.accounts.create(payload);
      if (!account) {
        const isFirst = existingAccountCount === 0;
        captureActivationMilestone(AnalyticsEvents.JOURNAL_CREATED, {
          journal_id: saved.id,
          is_first: isFirst,
        });
        if (broker.trim()) {
          captureActivationMilestone(AnalyticsEvents.BROKER_CONNECTED, {
            journal_id: saved.id,
            broker: broker.trim(),
          });
        }
      } else if (broker.trim() && !account.broker?.trim()) {
        captureActivationMilestone(AnalyticsEvents.BROKER_CONNECTED, {
          journal_id: saved.id,
          broker: broker.trim(),
        });
      }
      toast.success(account ? 'Journal updated' : 'Journal created');
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save journal');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="space-y-4 border-b px-6 py-4">
          <div className="space-y-1.5 text-left">
            <DialogTitle>{account ? 'Edit journal' : 'New journal'}</DialogTitle>
            <DialogDescription>
              Create a journal and optionally set risk limits.
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
          <div className="px-6 py-5">
            {wizard.current === 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Main live, FTMO 100k…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Currency</Label>
                  <Select
                    value={currency}
                    onValueChange={setCurrency}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Broker / firm</Label>
                  <Input
                    value={broker}
                    onChange={(e) => setBroker(e.target.value)}
                    placeholder="Interactive Brokers, FTMO…"
                  />
                </div>
                <NumberField
                  label="Starting balance"
                  value={startingBalance}
                  onChange={setStartingBalance}
                />
                <NumberField
                  label="Current balance"
                  value={currentBalance}
                  onChange={setCurrentBalance}
                />
              </div>
            )}

            {wizard.current === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <Label className="text-sm">Risk limits</Label>
                    <p className="text-xs text-muted-foreground">
                      Optional daily loss, max loss, and profit targets.
                    </p>
                  </div>
                  <Switch checked={riskLimitsEnabled} onCheckedChange={setRiskLimitsEnabled} />
                </div>

                {riskLimitsEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Firm name</Label>
                      <Input
                        value={firmName}
                        onChange={(e) => setFirmName(e.target.value)}
                        placeholder="FTMO, Apex…"
                      />
                    </div>
                    <NumberField
                      label="Profit target"
                      value={profitTarget}
                      onChange={setProfitTarget}
                    />
                    <NumberField
                      label="Daily loss limit"
                      value={dailyLossLimit}
                      onChange={setDailyLossLimit}
                    />
                    <NumberField
                      label="Max loss limit"
                      value={maxLossLimit}
                      onChange={setMaxLossLimit}
                    />
                    <div className="col-span-2 flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <Label className="text-sm">Trailing drawdown</Label>
                        <p className="text-xs text-muted-foreground">
                          Max loss trails your peak balance.
                        </p>
                      </div>
                      <Switch checked={trailingDrawdown} onCheckedChange={setTrailingDrawdown} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Select
                        value={challengeStatus}
                        onValueChange={(v) => setChallengeStatus(v as ChallengeStatus)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="passed">Passed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Started</Label>
                      <Input
                        type="date"
                        value={challengeStartedAt}
                        onChange={(e) => setChallengeStartedAt(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {wizard.current === 2 && (
              <dl className="divide-y rounded-lg border">
                <ReviewRow label="Name" value={name.trim() || '—'} />
                <ReviewRow label="Type" value={TYPE_LABELS[type]} />
                <ReviewRow label="Currency" value={currency} />
                <ReviewRow label="Broker" value={broker.trim() || '—'} />
                <ReviewRow
                  label="Starting balance"
                  value={formatCurrency(Number(startingBalance) || 0)}
                />
                <ReviewRow
                  label="Current balance"
                  value={formatCurrency(Number(currentBalance) || 0)}
                />
                <ReviewRow label="Risk limits" value={riskLimitsEnabled ? 'Enabled' : 'None'} />
                {riskLimitsEnabled && (
                  <>
                    <ReviewRow label="Firm" value={firmName.trim() || '—'} />
                    <ReviewRow
                      label="Profit target"
                      value={profitTarget.trim() ? formatCurrency(Number(profitTarget)) : '—'}
                    />
                    <ReviewRow
                      label="Daily loss limit"
                      value={dailyLossLimit.trim() ? formatCurrency(Number(dailyLossLimit)) : '—'}
                    />
                    <ReviewRow
                      label="Max loss limit"
                      value={maxLossLimit.trim() ? formatCurrency(Number(maxLossLimit)) : '—'}
                    />
                    <ReviewRow label="Trailing drawdown" value={trailingDrawdown ? 'Yes' : 'No'} />
                    <ReviewRow label="Status" value={STATUS_LABELS[challengeStatus]} />
                    <ReviewRow label="Started" value={challengeStartedAt || '—'} />
                  </>
                )}
              </dl>
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
              {saving ? 'Saving…' : account ? 'Save changes' : 'Create'}
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

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type="number" step="any" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
