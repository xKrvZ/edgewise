import { ReplayCandlestickCanvas } from '@/components/marketing/replay-candlestick-canvas';
import { REPLAY_BENEFITS } from '@/components/marketing/marketing-data';
import { MarketingSection } from '@/components/marketing/marketing-section';
import { ArrowRight, Check, Pause, SkipBack, SkipForward } from 'lucide-react';
import Link from 'next/link';

export function MarketingReplaySection() {
  return (
    <MarketingSection id="trade-replay">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
              Replay. Reflect. Improve.
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              See every decision with total clarity.
            </h2>
            <ul className="mt-8 space-y-3.5">
              {REPLAY_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-slate-600">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" aria-hidden="true" />
                  </span>
                  <span className="text-sm leading-6 sm:text-base">{benefit}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/sign-in"
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl"
            >
              Explore replay
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="flex flex-col border-t border-slate-100 bg-slate-950 p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div>
                <span className="text-sm font-bold text-white sm:text-base">NQ 12 SEP 24 · 5m</span>
                <p className="mt-0.5 text-xs text-slate-400">Session replay · 09:30 – 11:45 ET</p>
              </div>
              <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary-foreground/70 ring-1 ring-primary/100/30">
                Replay Mode
              </span>
            </div>

            <div className="min-h-[12rem] flex-1 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 sm:min-h-[14rem]">
              <ReplayCandlestickCanvas />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-slate-300 transition-colors hover:bg-white/15"
                  aria-label="Skip back"
                  tabIndex={-1}
                >
                  <SkipBack className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-white shadow-lg shadow-primary/30"
                  aria-label="Pause"
                  tabIndex={-1}
                >
                  <Pause className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-slate-300 transition-colors hover:bg-white/15"
                  aria-label="Skip forward"
                  tabIndex={-1}
                >
                  <SkipForward className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1">
                <div className="h-1.5 rounded-full bg-white/10">
                  <div className="relative h-1.5 w-2/3 rounded-full bg-gradient-to-r from-primary to-primary/70">
                    <span className="absolute -right-1.5 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-primary/50 shadow-sm" />
                  </div>
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
                  <span>09:42</span>
                  <span>11:45</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingSection>
  );
}
