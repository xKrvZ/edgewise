import { FEATURE_SPOTLIGHTS } from '@/components/marketing/marketing-data';
import { MarketingSection, marketingSectionContentClass } from '@/components/marketing/marketing-section';
import { MarketingSectionHeader } from '@/components/marketing/marketing-section-header';
import { ArrowRight, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function MarketingFeatureSpotlights() {
  return (
    <MarketingSection>
      <MarketingSectionHeader
        eyebrow="Deep dive"
        title="Feature highlights that move the needle"
        description="Benefit-led tools for trade replay, AI review, trading analytics, community, and backtesting — all in one journal."
      />

      <div className={`${marketingSectionContentClass} space-y-6 lg:space-y-8`}>
        {FEATURE_SPOTLIGHTS.map(
          ({ id, eyebrow, title, description, bullets, image, imageAlt, reversed }) => (
            <article
              key={id}
              id={id}
              className="scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`grid items-center gap-8 p-6 sm:p-8 md:p-10 lg:grid-cols-2 lg:gap-12 lg:p-12 xl:gap-14 ${
                  reversed ? 'lg:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
                    {eyebrow}
                  </p>
                  <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    {title}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
                  <ul className="mt-6 space-y-3">
                    {bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 text-sm text-slate-600">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10">
                          <Check className="h-3 w-3 text-primary" aria-hidden="true" />
                        </span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/sign-in"
                    className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-primary/80"
                  >
                    Get started with {eyebrow}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>

                <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                  <div
                    className="pointer-events-none absolute -inset-4 rounded-3xl bg-primary/50/10 blur-2xl"
                    aria-hidden="true"
                  />
                  <Image
                    src={image}
                    alt={imageAlt}
                    width={640}
                    height={480}
                    className="relative aspect-[4/3] w-full rounded-2xl border border-slate-200 object-cover shadow-lg"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                  />
                </div>
              </div>
            </article>
          ),
        )}
      </div>
    </MarketingSection>
  );
}
