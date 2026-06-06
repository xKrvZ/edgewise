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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, api } from '@/lib/api-client';
import {
  type Backtest,
  type CreateBacktestInput,
  MARKET_TYPES,
  type MarketType,
} from '@/lib/types';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface BacktestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backtest?: Backtest;
  onSaved?: (backtest: Backtest) => void;
}

export function BacktestFormDialog({
  open,
  onOpenChange,
  backtest,
  onSaved,
}: BacktestFormDialogProps) {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('AAPL');
  const [marketType, setMarketType] = useState<MarketType>('stocks');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(backtest?.name ?? '');
    setSymbol(backtest?.symbol ?? 'AAPL');
    setMarketType(backtest?.marketType ?? 'stocks');
    setStartDate(
      backtest?.startDate?.slice(0, 10) ??
        format(new Date(Date.now() - 7 * 86400000), 'yyyy-MM-dd'),
    );
    setEndDate(backtest?.endDate?.slice(0, 10) ?? format(new Date(), 'yyyy-MM-dd'));
    setNotes(backtest?.notes ?? '');
  }, [open, backtest]);

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!symbol.trim() || !startDate || !endDate) {
      toast.error('Symbol and date range are required');
      return;
    }
    const payload: CreateBacktestInput = {
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      marketType,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      notes: notes.trim() || undefined,
    };
    setSaving(true);
    try {
      const saved = backtest
        ? await api.backtests.update(backtest.id, payload)
        : await api.backtests.create(payload);
      toast.success(backtest ? 'Backtest updated' : 'Backtest created');
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save backtest');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{backtest ? 'Edit backtest' : 'New backtest'}</DialogTitle>
          <DialogDescription>Replay historical price and place simulated trades.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ORB on NVDA"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Symbol</Label>
              <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Market</Label>
              <Select value={marketType} onValueChange={(v) => setMarketType(v as MarketType)}>
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
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">End date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : backtest ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
