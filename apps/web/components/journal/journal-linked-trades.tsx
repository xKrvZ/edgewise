'use client';

import { Badge } from '@/components/ui/badge';
import type { JournalEntryTradeSummary } from '@/lib/types';
import { format } from 'date-fns';
import Link from 'next/link';

interface JournalLinkedTradesProps {
  trades: JournalEntryTradeSummary[];
}

export function JournalLinkedTrades({ trades }: JournalLinkedTradesProps) {
  if (trades.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {trades.map((trade) => (
        <Link key={trade.id} href={`/trades/${trade.id}`} onClick={(e) => e.stopPropagation()}>
          <Badge variant="outline" className="font-normal hover:border-primary/60">
            {trade.symbol} · {format(new Date(trade.entryTime), 'MMM d')}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
