import { MarketingComparisonTable } from '@/components/marketing/marketing-comparison-table';
import { MarketingSection, marketingSectionContentClass } from '@/components/marketing/marketing-section';
import { MarketingSectionHeader } from '@/components/marketing/marketing-section-header';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function MarketingComparisonTeaser() {
  return (
    <MarketingSection>
      <MarketingSectionHeader
        eyebrow="Compare"
        title="How Edgewise stacks up"
        description="Trade journal software compared on replay, AI review, prop firm tracking, and more — see the full breakdown on our pricing page."
      />

      <div className={`${marketingSectionContentClass} -mx-1 px-1 sm:mx-0 sm:px-0`}>
        <MarketingComparisonTable compact />
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/pricing#compare"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
        >
          View full comparison
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </MarketingSection>
  );
}
