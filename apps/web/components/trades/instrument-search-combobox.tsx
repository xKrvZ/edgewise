'use client';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api-client';
import type { Instrument, MarketType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

interface InstrumentSearchComboboxProps {
  value: string;
  onChange: (symbol: string) => void;
  onSelect?: (instrument: Instrument) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function InstrumentSearchCombobox({
  value,
  onChange,
  onSelect,
  placeholder = 'Search symbol…',
  className,
  autoFocus,
}: InstrumentSearchComboboxProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!open || query.trim().length < 1) {
      setResults([]);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const items = await api.instruments.search(query.trim(), 20);
        if (!controller.signal.aborted) {
          setResults(items);
          setActiveIndex(items.length > 0 ? 0 : -1);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setActiveIndex(-1);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function selectInstrument(instrument: Instrument) {
    setQuery(instrument.symbol);
    onChange(instrument.symbol);
    onSelect?.(instrument);
    setOpen(false);
    setResults([]);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const picked = results[activeIndex];
      if (picked) selectInstrument(picked);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          autoFocus={autoFocus}
          value={query}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const next = e.target.value.toUpperCase();
            setQuery(next);
            onChange(next);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-8"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && query.trim().length > 0 && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
        >
          {results.length === 0 && !loading ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              No instruments found. Pick a symbol from the catalog.
            </p>
          ) : (
            <ScrollArea className="max-h-60">
              <div className="flex flex-col p-1">
                {results.map((instrument, index) => (
                  <button
                    key={instrument.id}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectInstrument(instrument)}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                      index === activeIndex && 'bg-accent text-accent-foreground',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="font-medium">{instrument.symbol}</span>
                      <span className="ml-2 truncate text-muted-foreground">{instrument.name}</span>
                    </span>
                    <Badge variant="secondary" className="shrink-0 capitalize">
                      {instrument.assetClass}
                    </Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}

export function assetClassToMarketType(assetClass: string): MarketType {
  if (
    assetClass === 'stocks' ||
    assetClass === 'futures' ||
    assetClass === 'forex' ||
    assetClass === 'crypto' ||
    assetClass === 'options'
  ) {
    return assetClass;
  }
  return 'stocks';
}
