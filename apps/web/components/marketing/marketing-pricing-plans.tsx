'use client';

import { PRICING_PLANS } from '@/components/marketing/marketing-data';
import {
  marketingCardClass,
  marketingCardFeaturedClass,
  marketingCardHoverClass,
  marketingSectionContentClass,
} from '@/components/marketing/marketing-section';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface MarketingPricingPlansProps {
  className?: string;
}

const pricingCardShellClass = cn(
  marketingCardClass,
  marketingCardHoverClass,
  'relative flex h-full flex-col p-6 sm:p-7 lg:p-8',
);

const pricingBadgeBaseClass =
  'absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide';

const pricingCtaPrimaryClass =
  'mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30';

const pricingCtaSecondaryClass =
  'mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-slate-50 hover:shadow-md';

export function MarketingPricingPlans({ className }: MarketingPricingPlansProps) {
  const [annual, setAnnual] = useState(false);

  return (
    <div className={className}>
      <div className={`flex flex-col items-center gap-4 sm:flex-row sm:justify-center ${marketingSectionContentClass}`}>
        <div
          className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm"
          role="group"
          aria-label="Billing period"
        >
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              !annual ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-950',
            )}
            aria-pressed={!annual}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              annual ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-950',
            )}
            aria-pressed={annual}
          >
            Annual
            <span className="ml-1.5 text-xs font-bold text-emerald-600">Save 20%</span>
          </button>
        </div>
        <p className="text-xs text-slate-500">Starter from $10/month — Pro and Elite launch soon</p>
      </div>

      <div className="mx-auto mt-8 grid w-full max-w-7xl gap-6 lg:grid-cols-3 lg:gap-8">
        {PRICING_PLANS.map(
          ({
            name,
            monthlyPrice,
            annualPrice,
            period,
            description,
            features,
            cta,
            ctaHref,
            highlighted,
            badge,
            comingSoon,
          }) => {
            const price = annual ? annualPrice : monthlyPrice;
            const showAnnualNote = annual && !comingSoon;

            return (
              <div
                key={name}
                className={cn(pricingCardShellClass, highlighted && marketingCardFeaturedClass)}
              >
                {badge && (
                  <span
                    className={cn(
                      pricingBadgeBaseClass,
                      highlighted
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'border border-slate-200 bg-white text-slate-600 shadow-sm',
                    )}
                  >
                    {highlighted && (
                      <Sparkles className="mr-1 inline h-3 w-3" aria-hidden="true" />
                    )}
                    {badge}
                  </span>
                )}

                <h3 className="text-xl font-bold text-slate-950">{name}</h3>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                    {price}
                  </span>
                  <span className="text-sm text-slate-500">
                    /{period}
                    {showAnnualNote && ' billed annually'}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>

                <ul className="mt-8 flex-1 space-y-3.5 border-t border-slate-100 pt-8">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" aria-hidden="true" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {comingSoon ? (
                  <Link href={ctaHref} className={pricingCtaSecondaryClass}>
                    {cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <Link href={ctaHref} className={pricingCtaPrimaryClass}>
                    {cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
