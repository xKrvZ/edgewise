'use client';

import { PRICING_PLANS } from '@/components/marketing/marketing-data';
import { marketingSectionContentClass } from '@/components/marketing/marketing-section';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface MarketingPricingPlansProps {
  className?: string;
}

export function MarketingPricingPlans({ className }: MarketingPricingPlansProps) {
  const [annual, setAnnual] = useState(false);

  return (
    <div className={className}>
      <div className={`flex flex-col items-center gap-4 sm:flex-row sm:justify-center ${marketingSectionContentClass}`}>
        <div
          className="inline-flex items-center rounded-full border border-slate-200 bg-[#f7f8fc] p-1 shadow-sm"
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
            <span className="ml-1.5 text-xs font-bold text-emerald-500">Save 20%</span>
          </button>
        </div>
        <p className="text-xs text-slate-400">Billing preview — paid plans launching soon</p>
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
            const showAnnualNote = annual && !comingSoon && name !== 'Free';

            return (
              <div
                key={name}
                className={`relative flex h-full flex-col rounded-3xl border p-8 transition-all sm:p-9 ${
                  highlighted
                    ? 'z-[1] border-primary/30 bg-white shadow-xl shadow-primary/10 ring-1 ring-primary/20 lg:-mt-2 lg:mb-2 lg:py-10'
                    : 'border-slate-200 bg-[#f7f8fc] shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                      highlighted
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'bg-slate-100 text-slate-500'
                    }`}
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
                  <Link
                    href={ctaHref}
                    className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-6 py-3.5 text-sm font-bold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary/10"
                  >
                    {cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <Link
                    href={ctaHref}
                    className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl"
                  >
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
