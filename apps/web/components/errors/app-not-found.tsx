'use client';

import '@/components/errors/error-page-styles.css';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

interface AppNotFoundProps {
  /** When true, fills the main content column inside the app shell. */
  embedded?: boolean;
}

function FlatlineChart() {
  return (
    <svg
      viewBox="0 0 320 80"
      className="mx-auto h-20 w-full max-w-sm text-primary/80"
      aria-hidden
    >
      <line
        x1="0"
        y1="58"
        x2="320"
        y2="58"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 0 30 H 72 L 128 32 L 168 35 L 188 38 L 202 58"
      />
      <path
        className="error-flatline-pulse"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M 202 58 H 320"
      />
      <circle cx="202" cy="58" r="3" fill="currentColor" className="opacity-90" />
    </svg>
  );
}

function JournalEntryCard() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-border/80 bg-card/80 p-4 text-left shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Journal entry · auto-logged
        </span>
        <span className="rounded-md bg-destructive/10 px-2 py-0.5 font-mono text-xs font-semibold text-destructive">
          -1 clarity
        </span>
      </div>
      <dl className="mt-3 space-y-2 font-mono text-xs text-muted-foreground">
        <div className="flex justify-between gap-4">
          <dt>Setup</dt>
          <dd className="text-foreground">Unknown route</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Outcome</dt>
          <dd className="text-destructive">Stop hit — page not found</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Lesson</dt>
          <dd className="text-right text-foreground">Verify links before clicking through</dd>
        </div>
      </dl>
    </div>
  );
}

export function AppNotFound({ embedded = false }: AppNotFoundProps) {
  const shellClass = embedded
    ? 'flex min-h-[min(70vh,40rem)] flex-col items-center justify-center px-4 py-12'
    : 'flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16';

  return (
    <div className={shellClass}>
      <div className="relative w-full max-w-lg text-center">
        <div
          className="pointer-events-none absolute -inset-8 rounded-full bg-primary/5 blur-3xl"
          aria-hidden
        />

        <p className="relative font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">
          Route rejected · HTTP 404
        </p>

        <h1 className="relative mt-3 font-mono text-6xl font-bold tabular-nums tracking-tighter text-foreground sm:text-7xl">
          404
        </h1>

        <h2 className="relative mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Stop loss hit — this page doesn&apos;t exist.
        </h2>

        <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          The URL you opened isn&apos;t in your journal. It may have moved, been removed, or never
          shipped. Log it as a miss and route back to familiar ground.
        </p>

        <div className="relative mt-8">
          <FlatlineChart />
        </div>

        <div className="relative mt-6">
          <JournalEntryCard />
        </div>

        <div className="relative mt-8 flex justify-center">
          <Button asChild className="min-w-[10rem] gap-2">
            <Link href="/dashboard">
              <BookOpen className="h-4 w-4" />
              My Journal
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
