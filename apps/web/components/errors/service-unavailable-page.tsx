'use client';

import '@/components/errors/error-page-styles.css';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Home, RefreshCw, ServerCrash } from 'lucide-react';
import Link from 'next/link';

export function ServiceUnavailablePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--warning)/0.12),transparent_65%)]"
        aria-hidden
      />

      <div className="relative flex flex-col items-center text-center">
        <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
          <span
            className="error-pulse-ring absolute inset-0 rounded-full border-2 border-warning/40"
            aria-hidden
          />
          <span
            className="error-pulse-ring absolute inset-3 rounded-full border border-warning/25"
            style={{ animationDelay: '0.4s' }}
            aria-hidden
          />
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/15 text-warning ring-1 ring-warning/30">
            <ServerCrash className="h-8 w-8" aria-hidden />
          </span>
        </div>

        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-warning">
          Circuit breaker · HTTP 503
        </p>

        <h1 className="mt-3 font-mono text-5xl font-bold tabular-nums tracking-tighter text-foreground sm:text-6xl">
          503
        </h1>

        <h2 className="mt-4 max-w-lg text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Trading halted — we&apos;re tuning the engine room.
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Edgewise is temporarily unavailable while we deploy fixes or handle heavy load. Your data
          is safe; we&apos;ll reopen the book as soon as systems are green.
        </p>

        <StatusBars />

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            type="button"
            className="min-w-[10rem] gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline" className="min-w-[10rem] gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go to homepage
            </Link>
          </Button>
        </div>

        <p className="mt-10 font-mono text-xs text-muted-foreground">
          If this persists, check back in a few minutes or contact support.
        </p>
      </div>
    </div>
  );
}

function StatusBars() {
  const heights = [28, 42, 36, 52, 38, 48, 32, 44];

  return (
    <div
      className="mt-8 flex h-14 items-end justify-center gap-1.5"
      role="img"
      aria-label="Systems recovering"
    >
      {heights.map((height, index) => (
        <span
          key={index}
          className={cn(
            'w-2 rounded-sm bg-warning/50',
            index % 2 === 0 ? 'error-float' : 'error-float-delayed',
          )}
          style={{ height: `${height}px`, animationDelay: `${index * 0.15}s` }}
        />
      ))}
    </div>
  );
}
