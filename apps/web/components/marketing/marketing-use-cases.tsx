import { USE_CASES } from '@/components/marketing/marketing-data';
import { MarketingSection, marketingSectionContentClass } from '@/components/marketing/marketing-section';
import { MarketingSectionHeader } from '@/components/marketing/marketing-section-header';
import { Check } from 'lucide-react';

export function MarketingUseCases() {
  return (
    <MarketingSection id="use-cases" band>
      <MarketingSectionHeader
        eyebrow="Use cases"
        title="Built for how you actually trade"
        description="Whether you scalp futures, pass prop firm evals, or mentor a desk — Edgewise fits your review workflow."
      />

      <div className={`${marketingSectionContentClass} grid gap-6 md:grid-cols-3 lg:gap-8`}>
        {USE_CASES.map(({ title, description, highlights }) => (
          <article
            key={title}
            className="flex h-full flex-col rounded-3xl border border-slate-200 bg-[#f7f8fc] p-8 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-9"
          >
            <h3 className="text-xl font-bold text-slate-950">{title}</h3>
            <p className="mt-3 flex-1 text-sm leading-7 text-slate-500">{description}</p>
            <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" aria-hidden="true" />
                  </span>
                  {highlight}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </MarketingSection>
  );
}
