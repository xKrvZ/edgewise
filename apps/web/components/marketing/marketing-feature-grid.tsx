import { FEATURE_ACCENT_STYLES, FEATURE_GRID } from '@/components/marketing/marketing-data';
import { MarketingSection, marketingSectionContentClass } from '@/components/marketing/marketing-section';
import { MarketingSectionHeader } from '@/components/marketing/marketing-section-header';
import { cn } from '@/lib/utils';

const featureGridColsClass =
  FEATURE_GRID.length >= 5 ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-4';

export function MarketingFeatureGrid() {
  return (
    <MarketingSection id="features" band>
      <MarketingSectionHeader
        eyebrow="Features"
        title="Everything in one trade journal"
        description="Trading journal software with replay, analytics, AI review, and prop firm tracking — built for futures and forex day traders."
      />

      <div
        className={cn(
          marketingSectionContentClass,
          'grid gap-6 sm:grid-cols-2 lg:gap-8',
          featureGridColsClass,
        )}
      >
        {FEATURE_GRID.map(({ icon: Icon, title, description, accent }) => {
          const styles = FEATURE_ACCENT_STYLES[accent];

          return (
            <div
              key={title}
              className={`group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-transparent transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg sm:p-7 ${styles.ring}`}
            >
              <div
                className={`mb-5 grid h-12 w-12 place-items-center rounded-xl border ${styles.icon}`}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-slate-950">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          );
        })}
      </div>
    </MarketingSection>
  );
}
