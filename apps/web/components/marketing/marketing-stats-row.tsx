import { OUTCOME_STATS } from '@/components/marketing/marketing-data';
import { MarketingSection } from '@/components/marketing/marketing-section';

export function MarketingStatsRow() {
  return (
    <MarketingSection aria-label="Trading performance outcomes" band>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid divide-y divide-slate-200/80 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {OUTCOME_STATS.map(({ value, label }, index) => (
            <div
              key={value}
              className={`flex flex-col items-center px-6 py-10 text-center sm:px-8 sm:py-12 ${
                index === 0 ? 'bg-primary/5/60' : ''
              }`}
            >
              <p className="text-4xl font-black tracking-tight text-primary sm:text-5xl lg:text-[3.25rem]">
                {value}
              </p>
              <p className="mt-3 max-w-[13rem] text-sm leading-6 text-slate-500 sm:text-[0.9375rem]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </MarketingSection>
  );
}
