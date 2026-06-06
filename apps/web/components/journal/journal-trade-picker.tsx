'use client';

import { MultiSelect } from '@/components/shared/multi-select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ApiError, api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import { MAX_JOURNAL_ENTRY_TRADES } from '@/lib/types';
import { format, subDays } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface JournalTradePickerProps {
  selected: string[];
  onChange: (tradeIds: string[]) => void;
  enabled: boolean;
}

export function JournalTradePicker({ selected, onChange, enabled }: JournalTradePickerProps) {
  const [loadingLastWeek, setLoadingLastWeek] = useState(false);

  const recentTrades = useQuery(
    () => api.trades.list({ limit: 100, page: 1 }),
    [],
    { enabled },
  );

  const options = useMemo(
    () =>
      (recentTrades.data?.items ?? []).map((t) => ({
        value: t.id,
        label: `${t.symbol} · ${format(new Date(t.entryTime), 'MMM d, yyyy')}`,
      })),
    [recentTrades.data?.items],
  );

  async function selectLastSevenDays() {
    setLoadingLastWeek(true);
    try {
      const dateFrom = subDays(new Date(), 7).toISOString();
      const page = await api.trades.list({ dateFrom, limit: MAX_JOURNAL_ENTRY_TRADES, page: 1 });
      const ids = page.items.map((t) => t.id);
      if (ids.length === 0) {
        toast.message('No trades in the last 7 days');
        return;
      }
      if (ids.length > MAX_JOURNAL_ENTRY_TRADES) {
        toast.warning(`Only the first ${MAX_JOURNAL_ENTRY_TRADES} trades were selected`);
      }
      onChange(ids.slice(0, MAX_JOURNAL_ENTRY_TRADES));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load trades');
    } finally {
      setLoadingLastWeek(false);
    }
  }

  function handleChange(values: string[]) {
    if (values.length > MAX_JOURNAL_ENTRY_TRADES) {
      toast.error(`You can link at most ${MAX_JOURNAL_ENTRY_TRADES} trades`);
      onChange(values.slice(0, MAX_JOURNAL_ENTRY_TRADES));
      return;
    }
    onChange(values);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">Link trades (optional)</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={selectLastSevenDays}
            disabled={loadingLastWeek}
          >
            {loadingLastWeek && <Loader2 className="h-3 w-3 animate-spin" />}
            Last 7 days
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onChange([])}
            disabled={selected.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>
      <MultiSelect
        options={options}
        selected={selected}
        onChange={handleChange}
        placeholder="Select trades to discuss…"
        emptyText={
          recentTrades.isLoading ? 'Loading trades…' : 'No trades yet. Log trades first.'
        }
      />
      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selected.length} of {MAX_JOURNAL_ENTRY_TRADES} trades selected
        </p>
      )}
    </div>
  );
}
