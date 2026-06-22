import { HOW_IT_WORKS_STEPS } from '@/components/marketing/marketing-data';
import { MarketingSection, marketingSectionContentClass } from '@/components/marketing/marketing-section';
import { MarketingSectionHeader } from '@/components/marketing/marketing-section-header';

export function MarketingHowItWorks() {
  return (
    <MarketingSection id="how-it-works">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12 lg:p-14">
        <MarketingSectionHeader
          eyebrow="How it works"
          title="Your path to consistent performance"
          description="Four simple steps from raw trade data to measurable improvement."
        />

        <div className={`relative ${marketingSectionContentClass}`}>
          <div
            className="absolute left-[16.67%] right-[16.67%] top-8 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block"
            aria-hidden="true"
          />

          <div className="grid justify-center gap-10 md:grid-cols-3 md:gap-6 lg:gap-8">
            {HOW_IT_WORKS_STEPS.map(({ step, icon: Icon, title, description }) => (
              <div key={title} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-6">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-primary/20 bg-white shadow-sm ring-4 ring-primary/10">
                    <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-white shadow-md shadow-primary/30">
                    {step}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-950">{title}</h3>
                <p className="mt-2 max-w-[15rem] text-sm leading-6 text-slate-500 sm:text-[0.9375rem]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MarketingSection>
  );
}
