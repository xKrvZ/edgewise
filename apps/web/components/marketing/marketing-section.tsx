import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

/** Shared horizontal gutter for marketing pages — aligns nav, sections, and footer. */
export const marketingContainerClass =
  'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';

/** Standard vertical rhythm between marketing sections. */
export const marketingSectionPaddingClass = 'py-16 md:py-20 lg:py-24';

/** Compact vertical rhythm (e.g. trusted-by band between hero and features). */
export const marketingSectionPaddingCompactClass = 'py-12 md:py-16';

/** Hero top inset — pairs with announcement bar spacing. */
export const marketingHeroPaddingClass =
  'pt-16 pb-8 sm:pt-20 md:pt-20 lg:pt-24 lg:pb-12';

/** Gap from section header block to content grid. */
export const marketingSectionContentClass = 'mt-12';

/** White card surface used on marketing and hub account pages. */
export const marketingCardClass =
  'rounded-2xl border-slate-200 bg-white shadow-sm';

type MarketingSectionProps = ComponentPropsWithoutRef<'section'> & {
  compact?: boolean;
  hero?: boolean;
  /** Full-width white band for alternating section rhythm. */
  band?: boolean;
};

export function MarketingSection({
  className,
  compact = false,
  hero = false,
  band = false,
  ...props
}: MarketingSectionProps) {
  const sectionClassName = cn(
    'relative z-10 scroll-mt-24',
    marketingContainerClass,
    hero
      ? marketingHeroPaddingClass
      : compact
        ? marketingSectionPaddingCompactClass
        : marketingSectionPaddingClass,
    className,
  );

  if (band) {
    return (
      <div className="bg-white">
        <section className={sectionClassName} {...props} />
      </div>
    );
  }

  return <section className={sectionClassName} {...props} />;
}
