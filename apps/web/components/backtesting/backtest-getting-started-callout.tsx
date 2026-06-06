'use client';

import { Button } from '@/components/ui/button';
import { Lightbulb, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'backtest-getting-started-dismissed';

interface BacktestGettingStartedCalloutProps {
  onCreate: () => void;
}

export function BacktestGettingStartedCallout({
  onCreate,
}: BacktestGettingStartedCalloutProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  }

  return (
    <div className="mb-6 flex gap-3 rounded-md border border-border bg-muted/40 px-4 py-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Lightbulb className="h-4 w-4 text-primary" />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground">Getting started with backtests</p>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground"
            aria-label="Dismiss"
            onClick={dismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Pick a symbol and date range, replay candles bar-by-bar, then log simulated entries and
          exits to see if a setup would have worked.
        </p>
        <Button size="sm" variant="secondary" onClick={onCreate}>
          Create your first backtest
        </Button>
      </div>
    </div>
  );
}
