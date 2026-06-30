'use client';

import { MultiSelect } from '@/components/shared/multi-select';
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
import { InstrumentSearchCombobox, assetClassToMarketType } from '@/components/trades/instrument-search-combobox';
import { ApiError, api } from '@/lib/api-client';
import { formatCurrency, formatDateTime, formatR } from '@/lib/format';
import { useReferenceData } from '@/lib/hooks/use-reference-data';
import { useWizard } from '@/lib/hooks/use-wizard';
import { type CreateTradeInput, MARKET_TYPES, TRADE_DIRECTIONS, type Trade } from '@/lib/types';
import { getUserTimezone, resolveTradingSessionId } from '@/lib/trading-session-resolver';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const EMOTIONS = [
  'Calm',
  'Confident',
  'Disciplined',
  'Anxious',
  'Fearful',
  'Greedy',
  'FOMO',
  'Revenge',
  'Bored',
  'Frustrated',
];

const NONE = '__none__';

type ExitType = 'stop_loss' | 'take_profit' | 'custom';

const EXIT_TYPE_LABELS: Record<ExitType, string> = {
  stop_loss: 'Hit stop loss',
  take_profit: 'Hit take profit',
  custom: 'Custom exit price',
};

function inferExitType(trade: Trade | undefined): ExitType | '' {
  if (!trade?.exitPrice) return '';
  if (trade.stopLoss != null && trade.exitPrice === trade.stopLoss) return 'stop_loss';
  if (trade.takeProfit != null && trade.exitPrice === trade.takeProfit) return 'take_profit';
  return 'custom';
}

const STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'execution', label: 'Execution' },
  { id: 'context', label: 'Context' },
  { id: 'review', label: 'Review' },
];

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function toIso(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function num(v: string): number | undefined {
  if (v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

function effectiveExitPrice(
  exitType: ExitType | '',
  exitPrice: string,
  stopLoss: string,
  takeProfit: string,
): number | undefined {
  if (exitType === 'stop_loss') return num(stopLoss);
  if (exitType === 'take_profit') return num(takeProfit);
  if (exitType === 'custom') return num(exitPrice);
  return num(exitPrice);
}

interface TradeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trade?: Trade;
  defaultAccountId?: string | null;
  onSaved?: (trade: Trade) => void;
}

interface FormState {
  accountId: string;
  symbol: string;
  marketType: string;
  direction: string;
  entryPrice: string;
  exitPrice: string;
  exitType: ExitType | '';
  quantity: string;
  stopLoss: string;
  takeProfit: string;
  fees: string;
  entryTime: string;
  exitTime: string;
  playbookId: string;
  emotion: string;
  executionRating: string;
  notes: string;
  status: string;
}

function buildInitialState(
  trade: Trade | undefined,
  defaultAccountId: string | null | undefined,
): FormState {
  return {
    accountId: trade?.accountId ?? defaultAccountId ?? '',
    symbol: trade?.symbol ?? '',
    marketType: trade?.marketType ?? 'stocks',
    direction: trade?.direction ?? 'long',
    entryPrice: trade?.entryPrice?.toString() ?? '',
    exitPrice: trade?.exitPrice?.toString() ?? '',
    exitType:
      trade?.status === 'open' ? '' : inferExitType(trade) || 'custom',
    quantity: trade?.quantity?.toString() ?? '',
    stopLoss: trade?.stopLoss?.toString() ?? '',
    takeProfit: trade?.takeProfit?.toString() ?? '',
    fees: trade?.fees?.toString() ?? '',
    entryTime: toLocalInput(trade?.entryTime) || toLocalInput(new Date().toISOString()),
    exitTime: toLocalInput(trade?.exitTime),
    playbookId: trade?.playbookId ?? '',
    emotion: trade?.emotion ?? '',
    executionRating: trade?.executionRating?.toString() ?? '',
    notes: trade?.notes ?? '',
    status: trade?.status ?? 'closed',
  };
}

export function TradeFormDialog({
  open,
  onOpenChange,
  trade,
  defaultAccountId,
  onSaved,
}: TradeFormDialogProps) {
  const { accounts, playbooks, sessions, tags, mistakes } = useReferenceData();
  const [form, setForm] = useState<FormState>(() => buildInitialState(trade, defaultAccountId));
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [mistakeIds, setMistakeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const timezone = useMemo(() => getUserTimezone(), []);

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(trade, defaultAccountId));
      setTagIds(trade?.tagIds ?? (trade?.tags ?? []).map((t) => t.id));
      setMistakeIds(trade?.mistakeIds ?? (trade?.mistakes ?? []).map((m) => m.id));
    }
  }, [open, trade, defaultAccountId]);

  useEffect(() => {
    if (form.exitType === 'stop_loss' && form.stopLoss) {
      setForm((f) => (f.exitPrice === f.stopLoss ? f : { ...f, exitPrice: f.stopLoss }));
    } else if (form.exitType === 'take_profit' && form.takeProfit) {
      setForm((f) =>
        f.exitPrice === f.takeProfit ? f : { ...f, exitPrice: f.takeProfit },
      );
    }
  }, [form.exitType, form.stopLoss, form.takeProfit]);

  const tagOptions = useMemo(
    () =>
      tags.map((t) => ({
        value: t.id,
        label: t.category && t.category !== 'custom' ? `${t.name} · ${t.category}` : t.name,
        color: t.color,
      })),
    [tags],
  );
  const mistakeOptions = useMemo(
    () => mistakes.map((m) => ({ value: m.id, label: m.name, color: m.color })),
    [mistakes],
  );

  const basicsValid = Boolean(form.accountId) && Boolean(form.symbol.trim());
  const executionValid =
    num(form.entryPrice) !== undefined &&
    num(form.quantity) !== undefined &&
    Boolean(toIso(form.entryTime));

  const wizard = useWizard(STEPS, {
    resetKey: open ? (trade?.id ?? 'new') : null,
    stepValidity: [basicsValid, executionValid, true, true],
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const accountName = accounts.find((a) => a.id === form.accountId)?.name;
  const playbookName = playbooks.find((p) => p.id === form.playbookId)?.name;
  const derivedSessionId = useMemo(() => {
    const entryIso = toIso(form.entryTime);
    if (!entryIso) return null;
    return resolveTradingSessionId(sessions, new Date(entryIso), timezone);
  }, [form.entryTime, sessions, timezone]);
  const derivedSessionName =
    sessions.find((s) => s.id === derivedSessionId)?.name ??
    (trade?.sessionId ? sessions.find((s) => s.id === trade.sessionId)?.name : null);
  const selectedTags = tagOptions.filter((t) => tagIds.includes(t.value));
  const selectedMistakes = mistakeOptions.filter((m) => mistakeIds.includes(m.value));

  const estimate = useMemo(() => {
    const entry = num(form.entryPrice);
    const exit =
      form.status === 'closed'
        ? effectiveExitPrice(form.exitType, form.exitPrice, form.stopLoss, form.takeProfit)
        : undefined;
    const qty = num(form.quantity);
    const fees = num(form.fees) ?? 0;
    const stop = num(form.stopLoss);
    if (entry === undefined || qty === undefined || exit === undefined) {
      return null;
    }
    const gross = form.direction === 'short' ? (entry - exit) * qty : (exit - entry) * qty;
    const pnl = gross - fees;
    const tp = num(form.takeProfit);
    let rMultiple: number | null = null;
    let riskDollars: number | null = null;
    let rewardDollars: number | null = null;
    if (stop !== undefined) {
      const risk = Math.abs(entry - stop) * qty;
      if (risk > 0) {
        rMultiple = pnl / risk;
        riskDollars = risk;
      }
    }
    if (tp !== undefined && stop !== undefined) {
      const reward = Math.abs(tp - entry) * qty;
      if (reward > 0) rewardDollars = reward;
    }
    const riskReward =
      riskDollars && rewardDollars && riskDollars > 0
        ? rewardDollars / riskDollars
        : null;
    return { pnl, rMultiple, riskDollars, rewardDollars, riskReward };
  }, [
    form.entryPrice,
    form.exitPrice,
    form.exitType,
    form.quantity,
    form.fees,
    form.stopLoss,
    form.takeProfit,
    form.direction,
    form.status,
  ]);

  async function handleSubmit() {
    if (!basicsValid) {
      toast.error('Account and symbol are required');
      wizard.goTo(0);
      return;
    }
    const entryPrice = num(form.entryPrice);
    const quantity = num(form.quantity);
    const entryTime = toIso(form.entryTime);
    if (entryPrice === undefined || quantity === undefined || !entryTime) {
      toast.error('Entry price, quantity and entry time are required');
      wizard.goTo(1);
      return;
    }

    if (form.status === 'closed') {
      if (!form.exitType) {
        toast.error('Select how the trade was closed');
        wizard.goTo(1);
        return;
      }
      if (form.exitType === 'stop_loss' && num(form.stopLoss) === undefined) {
        toast.error('Stop loss is required when exiting at stop loss');
        wizard.goTo(1);
        return;
      }
      if (form.exitType === 'take_profit' && num(form.takeProfit) === undefined) {
        toast.error('Take profit is required when exiting at target');
        wizard.goTo(1);
        return;
      }
      if (
        form.exitType === 'custom' &&
        effectiveExitPrice(form.exitType, form.exitPrice, form.stopLoss, form.takeProfit) ===
          undefined
      ) {
        toast.error('Exit price is required for a custom exit');
        wizard.goTo(1);
        return;
      }
      if (!toIso(form.exitTime)) {
        toast.error('Exit time is required for closed trades');
        wizard.goTo(1);
        return;
      }
    }

    const resolvedExitPrice =
      form.status === 'closed'
        ? effectiveExitPrice(form.exitType, form.exitPrice, form.stopLoss, form.takeProfit)
        : undefined;

    const payload: CreateTradeInput = {
      accountId: form.accountId,
      symbol: form.symbol.trim().toUpperCase(),
      marketType: form.marketType as CreateTradeInput['marketType'],
      direction: form.direction as CreateTradeInput['direction'],
      entryPrice,
      quantity,
      entryTime,
      timezone,
      exitPrice: form.status === 'closed' ? resolvedExitPrice : null,
      exitType: form.status === 'closed' ? (form.exitType as ExitType) : undefined,
      stopLoss: num(form.stopLoss),
      takeProfit: num(form.takeProfit),
      fees: num(form.fees),
      exitTime: form.status === 'closed' ? toIso(form.exitTime) : null,
      playbookId: form.playbookId || undefined,
      setupId: form.playbookId || undefined,
      emotion: form.emotion || undefined,
      executionRating: num(form.executionRating),
      notes: form.notes.trim() || undefined,
      status: form.status as CreateTradeInput['status'],
      tagIds,
      mistakeIds,
    };

    setSaving(true);
    try {
      const saved = trade
        ? await api.trades.update(trade.id, payload)
        : await api.trades.create(payload);
      toast.success(trade ? 'Trade updated' : 'Trade logged');
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save trade';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-4 border-b px-6 py-4">
          <div className="space-y-1.5 text-left">
            <DialogTitle>{trade ? 'Edit trade' : 'Log a trade'}</DialogTitle>
            <DialogDescription>
              P&L and R-multiple are calculated automatically from your entry, exit and risk.
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Account" required>
                  <Select value={form.accountId} onValueChange={(v) => set('accountId', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select journal" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Symbol" required>
                  <InstrumentSearchCombobox
                    autoFocus
                    value={form.symbol}
                    onChange={(symbol) => set('symbol', symbol)}
                    onSelect={(instrument) =>
                      set('marketType', assetClassToMarketType(instrument.assetClass))
                    }
                    placeholder="Search ES, AAPL, EURUSD…"
                  />
                </Field>

                <Field label="Market">
                  <Select value={form.marketType} onValueChange={(v) => set('marketType', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MARKET_TYPES.map((m) => (
                        <SelectItem key={m} value={m} className="capitalize">
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Direction">
                  <Select value={form.direction} onValueChange={(v) => set('direction', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRADE_DIRECTIONS.map((d) => (
                        <SelectItem key={d} value={d} className="capitalize">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Status">
                    <Select
                      value={form.status}
                      onValueChange={(v) => {
                        if (v === 'open') {
                          setForm((f) => ({
                            ...f,
                            status: v,
                            exitType: '',
                            exitPrice: '',
                            exitTime: '',
                          }));
                        } else {
                          setForm((f) => ({
                            ...f,
                            status: v,
                            exitType: f.exitType || 'custom',
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            )}

            {wizard.current === 1 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Entry price" required>
                  <Input
                    autoFocus
                    type="number"
                    step="any"
                    value={form.entryPrice}
                    onChange={(e) => set('entryPrice', e.target.value)}
                  />
                </Field>

                {form.status === 'closed' && (
                  <>
                    <Field label="Exit type" required>
                      <Select
                        value={form.exitType || NONE}
                        onValueChange={(v) => {
                          const next = v === NONE ? '' : (v as ExitType);
                          set('exitType', next);
                          if (next === 'stop_loss' && form.stopLoss) {
                            set('exitPrice', form.stopLoss);
                          } else if (next === 'take_profit' && form.takeProfit) {
                            set('exitPrice', form.takeProfit);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="How did you exit?" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(EXIT_TYPE_LABELS) as ExitType[]).map((type) => (
                            <SelectItem key={type} value={type}>
                              {EXIT_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    {form.exitType === 'custom' ? (
                      <Field label="Exit price" required>
                        <Input
                          type="number"
                          step="any"
                          value={form.exitPrice}
                          onChange={(e) => set('exitPrice', e.target.value)}
                        />
                      </Field>
                    ) : form.exitType === 'stop_loss' ? (
                      <Field label="Exit price">
                        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                          {form.stopLoss || '—'}{' '}
                          <span className="text-muted-foreground">(stop loss)</span>
                        </p>
                      </Field>
                    ) : form.exitType === 'take_profit' ? (
                      <Field label="Exit price">
                        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                          {form.takeProfit || '—'}{' '}
                          <span className="text-muted-foreground">(take profit)</span>
                        </p>
                      </Field>
                    ) : (
                      <div />
                    )}
                  </>
                )}

                <Field label="Quantity" required>
                  <Input
                    type="number"
                    step="any"
                    value={form.quantity}
                    onChange={(e) => set('quantity', e.target.value)}
                  />
                </Field>
                <Field label="Fees / commissions">
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={form.fees}
                    onChange={(e) => set('fees', e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deducted from gross P&L for net result.
                  </p>
                </Field>

                <Field label="Stop loss">
                  <Input
                    type="number"
                    step="any"
                    value={form.stopLoss}
                    onChange={(e) => set('stopLoss', e.target.value)}
                  />
                </Field>
                <Field label="Take profit">
                  <Input
                    type="number"
                    step="any"
                    value={form.takeProfit}
                    onChange={(e) => set('takeProfit', e.target.value)}
                  />
                </Field>

                <Field label="Entry time" required>
                  <Input
                    type="datetime-local"
                    value={form.entryTime}
                    onChange={(e) => set('entryTime', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Logged in {timezone}</p>
                </Field>
                {form.status === 'closed' && (
                  <Field label="Exit time" required>
                    <Input
                      type="datetime-local"
                      value={form.exitTime}
                      onChange={(e) => set('exitTime', e.target.value)}
                    />
                  </Field>
                )}

                {estimate && (
                  <div className="sm:col-span-2 space-y-1 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                      <span className="text-muted-foreground">
                        Net P&L:{' '}
                        <span
                          className={cn(
                            'font-medium',
                            estimate.pnl >= 0 ? 'text-primary' : 'text-destructive',
                          )}
                        >
                          {formatCurrency(estimate.pnl, { signed: true })}
                        </span>
                      </span>
                      {estimate.rMultiple !== null && (
                        <span className="text-muted-foreground">
                          R-multiple:{' '}
                          <span className="font-medium text-foreground">
                            {formatR(estimate.rMultiple)}
                          </span>
                        </span>
                      )}
                    </div>
                    {(estimate.riskDollars !== null || estimate.rewardDollars !== null) && (
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        {estimate.riskDollars !== null && (
                          <span>
                            Risk:{' '}
                            <span className="font-medium text-destructive">
                              {formatCurrency(estimate.riskDollars)}
                            </span>
                          </span>
                        )}
                        {estimate.rewardDollars !== null && (
                          <span>
                            Reward:{' '}
                            <span className="font-medium text-success">
                              {formatCurrency(estimate.rewardDollars)}
                            </span>
                          </span>
                        )}
                        {estimate.riskReward !== null && (
                          <span>
                            R:R{' '}
                            <span className="font-medium text-foreground">
                              1:{estimate.riskReward.toFixed(2)}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {wizard.current === 2 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Setup / playbook">
                  <Select
                    value={form.playbookId || NONE}
                    onValueChange={(v) => set('playbookId', v === NONE ? '' : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {playbooks.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Tags">
                  <MultiSelect
                    options={tagOptions}
                    selected={tagIds}
                    onChange={setTagIds}
                    placeholder="Add tags"
                    emptyText="Create tags first."
                  />
                </Field>
                <Field label="Mistakes">
                  <MultiSelect
                    options={mistakeOptions}
                    selected={mistakeIds}
                    onChange={setMistakeIds}
                    placeholder="Add mistakes"
                    emptyText="Create mistakes first."
                  />
                </Field>

                <Field label="Emotion">
                  <Select
                    value={form.emotion || NONE}
                    onValueChange={(v) => set('emotion', v === NONE ? '' : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {EMOTIONS.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Execution rating">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() =>
                          set(
                            'executionRating',
                            form.executionRating === String(r) ? '' : String(r),
                          )
                        }
                        className={cn(
                          'h-9 flex-1 rounded-md border text-sm font-medium transition-colors',
                          Number(form.executionRating) >= r
                            ? 'border-primary bg-primary/15 text-primary'
                            : 'border-input text-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Notes">
                    <Textarea
                      value={form.notes}
                      onChange={(e) => set('notes', e.target.value)}
                      placeholder="What was your thesis? How did you execute?"
                      rows={3}
                    />
                  </Field>
                </div>
              </div>
            )}

            {wizard.current === 3 && (
              <div className="space-y-5">
                <ReviewSection title="Basics">
                  <ReviewRow label="Account" value={accountName ?? '—'} />
                  <ReviewRow label="Symbol" value={form.symbol.trim().toUpperCase() || '—'} />
                  <ReviewRow label="Market" value={form.marketType} capitalize />
                  <ReviewRow label="Direction" value={form.direction} capitalize />
                  <ReviewRow label="Status" value={form.status} capitalize />
                </ReviewSection>

                <ReviewSection title="Execution">
                  <ReviewRow
                    label="Entry"
                    value={`${form.entryPrice || '—'} × ${form.quantity || '—'}`}
                  />
                  {form.status === 'closed' && (
                    <>
                      <ReviewRow
                        label="Exit type"
                        value={
                          form.exitType ? EXIT_TYPE_LABELS[form.exitType as ExitType] : '—'
                        }
                      />
                      <ReviewRow
                        label="Exit price"
                        value={
                          effectiveExitPrice(
                            form.exitType,
                            form.exitPrice,
                            form.stopLoss,
                            form.takeProfit,
                          )?.toString() ?? '—'
                        }
                      />
                    </>
                  )}
                  <ReviewRow
                    label="Stop / target"
                    value={`${form.stopLoss || '—'} / ${form.takeProfit || '—'}`}
                  />
                  <ReviewRow label="Fees" value={form.fees || '—'} />
                  <ReviewRow label="Entry time" value={formatDateTime(toIso(form.entryTime))} />
                  <ReviewRow label="Timezone" value={timezone} />
                  {form.status === 'closed' && (
                    <ReviewRow
                      label="Exit time"
                      value={form.exitTime ? formatDateTime(toIso(form.exitTime)) : '—'}
                    />
                  )}
                  {estimate && (
                    <ReviewRow
                      label="Estimated P&L"
                      value={
                        <span
                          className={cn(estimate.pnl >= 0 ? 'text-primary' : 'text-destructive')}
                        >
                          {formatCurrency(estimate.pnl, { signed: true })}
                          {estimate.rMultiple !== null ? ` · ${formatR(estimate.rMultiple)}` : ''}
                        </span>
                      }
                    />
                  )}
                </ReviewSection>

                <ReviewSection title="Context">
                  <ReviewRow label="Playbook" value={playbookName ?? '—'} />
                  <ReviewRow label="Session" value={derivedSessionName ?? '—'} />
                  <ReviewRow
                    label="Tags"
                    value={selectedTags.length ? selectedTags.map((t) => t.label).join(', ') : '—'}
                  />
                  <ReviewRow
                    label="Mistakes"
                    value={
                      selectedMistakes.length
                        ? selectedMistakes.map((m) => m.label).join(', ')
                        : '—'
                    }
                  />
                  <ReviewRow label="Emotion" value={form.emotion || '—'} />
                  <ReviewRow
                    label="Execution rating"
                    value={form.executionRating ? `${form.executionRating}/5` : '—'}
                  />
                  {form.notes.trim() && <ReviewRow label="Notes" value={form.notes.trim()} />}
                </ReviewSection>
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
              {saving ? 'Saving…' : trade ? 'Save changes' : 'Log trade'}
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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border">
      <div className="border-b bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <dl className="divide-y">{children}</dl>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: React.ReactNode;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('text-right font-medium text-foreground', capitalize && 'capitalize')}>
        {value}
      </dd>
    </div>
  );
}
