import { AI_INSIGHT_CARDS } from '@/components/marketing/marketing-data';
import { MarketingSection } from '@/components/marketing/marketing-section';
import { ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function MarketingAiReviewSection() {
  return (
    <MarketingSection id="ai-review">
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="grid items-center gap-10 p-8 md:p-12 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary-foreground/70 ring-1 ring-primary/100/30">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              NEW
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
              AI Trade Review v2
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-slate-300 sm:text-lg">
              Smarter analysis. Deeper insights. Personalized feedback that helps you grow faster.
            </p>
            <Link
              href="/sign-in"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg"
            >
              Explore AI Review
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="space-y-6">
            <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
              <div
                className="pointer-events-none absolute -inset-4 rounded-3xl bg-primary/20 blur-2xl"
                aria-hidden="true"
              />
              <Image
                src="/marketing/ai-review-insight.png"
                alt="AI trade review insight cards showing strengths and weaknesses"
                width={480}
                height={480}
                className="relative w-full rounded-2xl border border-white/10 shadow-xl"
                sizes="(max-width: 1024px) 80vw, 40vw"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {AI_INSIGHT_CARDS.map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-primary/30 hover:bg-white/[0.07] sm:p-5"
                >
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-white sm:text-base">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MarketingSection>
  );
}
