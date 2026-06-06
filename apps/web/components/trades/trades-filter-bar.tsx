'use client';

import { DateRangeSelector } from '@/components/app/date-range-selector';
import { PageFilterBar } from '@/components/app/page-filter-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReferenceData } from '@/lib/hooks/use-reference-data';
import { MARKET_TYPES, type MarketType, TRADE_DIRECTIONS, type TradeDirection } from '@/lib/types';
import { useTradesFilterStore } from '@/stores/trades-filter-store';
import { Search, X } from 'lucide-react';

const ANY = '__any__';

export function TradesFilterBar() {
  const { playbooks, tags } = useReferenceData();
  const {
    symbol,
    direction,
    marketType,
    playbookId,
    tagId,
    setSymbol,
    setDirection,
    setMarketType,
    setPlaybookId,
    setTagId,
    reset,
  } = useTradesFilterStore();

  const hasFilters = symbol || direction || marketType || playbookId || tagId;

  return (
    <PageFilterBar>
      <DateRangeSelector />

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Search symbol…"
          className="h-9 w-44 pl-8"
        />
      </div>

      <Select
        value={direction ?? ANY}
        onValueChange={(v) => setDirection(v === ANY ? null : (v as TradeDirection))}
      >
        <SelectTrigger size="sm" className="h-9 w-32">
          <SelectValue placeholder="Direction" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any side</SelectItem>
          {TRADE_DIRECTIONS.map((d) => (
            <SelectItem key={d} value={d} className="capitalize">
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={marketType ?? ANY}
        onValueChange={(v) => setMarketType(v === ANY ? null : (v as MarketType))}
      >
        <SelectTrigger size="sm" className="h-9 w-32">
          <SelectValue placeholder="Market" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any market</SelectItem>
          {MARKET_TYPES.map((m) => (
            <SelectItem key={m} value={m} className="capitalize">
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={playbookId ?? ANY} onValueChange={(v) => setPlaybookId(v === ANY ? null : v)}>
        <SelectTrigger size="sm" className="h-9 w-40">
          <SelectValue placeholder="Setup" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any setup</SelectItem>
          {playbooks.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={tagId ?? ANY} onValueChange={(v) => setTagId(v === ANY ? null : v)}>
        <SelectTrigger size="sm" className="h-9 w-36">
          <SelectValue placeholder="Tag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any tag</SelectItem>
          {tags.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.category && t.category !== 'custom' ? `${t.name} (${t.category})` : t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={reset} className="h-9">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </PageFilterBar>
  );
}
