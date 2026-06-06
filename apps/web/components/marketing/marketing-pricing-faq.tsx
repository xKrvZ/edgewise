import { PRICING_FAQ } from '@/components/marketing/marketing-data';
import { ChevronDown } from 'lucide-react';

export function MarketingPricingFaq() {
  return (
    <div className="mx-auto mt-12 max-w-3xl">
      <h3 className="text-center text-2xl font-black tracking-tight text-slate-950">
        Pricing FAQ
      </h3>
      <div className="mt-8 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white shadow-sm">
        {PRICING_FAQ.map(({ question, answer }) => (
          <details key={question} className="group px-6 py-5 sm:px-8">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-bold text-slate-950 marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="text-base">{question}</span>
              <ChevronDown
                className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="mt-4 text-sm leading-7 text-slate-600">{answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
