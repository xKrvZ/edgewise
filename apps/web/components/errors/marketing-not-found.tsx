'use client';

import '@/components/errors/error-page-styles.css';
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell';
import { Button } from '@/components/ui/button';
import { Compass, Home, Sparkles } from 'lucide-react';
import Link from 'next/link';

const TICKER_ITEMS = [
  'PAGE·404',
  'ROUTE·DELISTED',
  'EDGE·NOT·FOUND',
  'NQ·???',
  'ES·VOID',
  'URL·GAP',
  '404·BID·NONE',
  'LINK·EXPIRED',
];

function TickerTape() {
  const tape = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      className="relative overflow-hidden border-y border-slate-200/80 bg-slate-950 py-2.5"
      aria-hidden
    >
      <div className="error-ticker flex w-max gap-10 whitespace-nowrap font-mono text-xs font-semibold tracking-[0.35em] text-emerald-400/90">
        {tape.map((item, index) => (
          <span key={`${item}-${index}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}

export function MarketingNotFound() {
  return (
    <MarketingPageShell>
      <TickerTape />

      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            <Compass className="h-3.5 w-3.5" aria-hidden />
            Off the map
          </p>

          <h1 className="error-flicker font-mono text-7xl font-black tracking-tighter text-slate-950 sm:text-8xl lg:text-9xl">
            404
          </h1>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            This page left before the closing bell.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            The URL you followed isn&apos;t on our order book — maybe it was renamed, removed, or
            never listed. No P&amp;L impact, just a dead link in the tape.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-w-[10rem] gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Back to home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[10rem] gap-2">
              <Link href="/pricing">
                <Sparkles className="h-4 w-4" />
                View pricing
              </Link>
            </Button>
          </div>

          <p className="mt-12 font-mono text-xs uppercase tracking-widest text-slate-400">
            Error code · HTTP 404 · Route not found
          </p>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f7f8fc] to-transparent"
          aria-hidden
        />
      </section>
    </MarketingPageShell>
  );
}
