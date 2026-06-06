import { MarketingSection } from '@/components/marketing/marketing-section';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

export function MarketingCtaBand() {
  return (
    <MarketingSection>
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 shadow-2xl shadow-primary/30 sm:px-10 sm:py-14 lg:px-14">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-primary/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              Ready to find your edge?
            </h2>
            <p className="mt-4 text-base leading-7 text-primary-foreground/90 sm:text-lg">
              Turn your trading data into better decisions — one review at a time.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-foreground/90">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary-foreground/80" aria-hidden="true" />
                Free forever plan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary-foreground/80" aria-hidden="true" />
                No credit card required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary-foreground/80" aria-hidden="true" />
                Cancel anytime
              </span>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:min-w-[16rem] sm:flex-row sm:gap-4">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-bold text-primary shadow-lg transition-all hover:-translate-y-0.5 hover:bg-primary/5 hover:shadow-xl sm:min-w-[11rem] sm:text-base"
            >
              Start for free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 px-7 py-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/10 sm:text-base"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </MarketingSection>
  );
}
