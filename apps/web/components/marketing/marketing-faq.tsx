import { FAQ_ITEMS } from '@/components/marketing/marketing-data';
import { MarketingSection, marketingSectionContentClass } from '@/components/marketing/marketing-section';
import { MarketingSectionHeader } from '@/components/marketing/marketing-section-header';
import { ChevronDown } from 'lucide-react';

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow open:shadow-md hover:border-slate-300">
      <summary className="flex min-h-[3.75rem] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-bold text-slate-950 marker:content-none sm:min-h-[4.25rem] sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
        <span className="text-base leading-snug sm:text-lg">{question}</span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-50 text-primary transition-colors group-open:border-primary/20 group-open:bg-primary/5">
          <ChevronDown
            className="h-5 w-5 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </span>
      </summary>
      <div className="border-t border-slate-100 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <p className="text-sm leading-7 text-slate-600 sm:text-base">{answer}</p>
      </div>
    </details>
  );
}

export function MarketingFaq() {
  return (
    <MarketingSection id="faq">
      <MarketingSectionHeader
        eyebrow="FAQ"
        title="Trading journal questions, answered"
        description="Everything you need to know about Edgewise trade journal software, replay, AI review, and prop firm tracking."
      />

      <div
        className={`flex w-full flex-col gap-4 sm:gap-5 ${marketingSectionContentClass}`}
      >
        {FAQ_ITEMS.map(({ question, answer }) => (
          <FaqItem key={question} question={question} answer={answer} />
        ))}
      </div>
    </MarketingSection>
  );
}
