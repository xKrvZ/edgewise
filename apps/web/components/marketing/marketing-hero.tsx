import { MarketingSection } from '@/components/marketing/marketing-section';
import { ArrowRight, Check, Play, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const HERO_STATS = [
  { label: 'Net P&L', value: '+$4,280', positive: true },
  { label: 'Win Rate', value: '62%', positive: false },
  { label: 'Profit Factor', value: '1.84', positive: false },
  { label: 'Avg R', value: '+0.6R', positive: false },
] as const;

export function MarketingHero() {
  return (
    <MarketingSection hero>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-xl lg:max-w-none">
          <p className="mb-5 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Built for serious traders
          </p>

          <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl xl:text-7xl">
            The trading journal{' '}
            <span className="block sm:inline">built for </span>
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              prop firm traders.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600 sm:text-xl">
            Edgewise is trade journal software for futures, forex, and day traders — log trades,
            replay sessions, run AI trade review, and track performance in one place. Stop repeating
            the same mistakes.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 sm:px-7 sm:py-4 sm:text-base"
            >
              Start journaling free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md sm:px-7 sm:py-4 sm:text-base"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              Watch demo
            </a>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              Free forever plan
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div
            className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-primary/50/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-2.5 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 sm:p-3">
            <Image
              src="/marketing/hero-dashboard.png"
              alt="Edgewise trading journal dashboard with trade replay, analytics, and AI review for futures and forex day traders"
              width={1200}
              height={750}
              className="rounded-2xl border border-slate-100"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />

            <div className="absolute inset-x-3 bottom-3 grid grid-cols-2 gap-2 sm:inset-x-5 sm:bottom-5 sm:grid-cols-4 sm:gap-2.5">
              {HERO_STATS.map(({ label, value, positive }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200/80 bg-white/95 px-2.5 py-2 shadow-lg backdrop-blur-sm sm:px-3 sm:py-2.5"
                >
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 sm:text-xs">
                    {label}
                  </p>
                  <p
                    className={`text-base font-bold sm:text-lg ${positive ? 'text-emerald-600' : 'text-slate-950'}`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="absolute -right-1 top-6 max-w-[10.5rem] rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-900 shadow-xl sm:-right-3 sm:top-8 sm:max-w-[13rem] sm:p-4 lg:max-w-xs lg:p-5">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-primary sm:text-sm">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  AI Insight
                </p>
                <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                  You perform best on Tuesday mornings. Win rate is 73%.
                </p>
            </div>
          </div>
        </div>
      </div>
    </MarketingSection>
  );
}
