import { MarketingPricingFaq } from '@/components/marketing/marketing-pricing-faq';
import { MarketingPricingPlans } from '@/components/marketing/marketing-pricing-plans';
import { SUPPORT_MAILTO } from '@/components/marketing/marketing-data';
import { MarketingSection } from '@/components/marketing/marketing-section';
import { MarketingSectionHeader } from '@/components/marketing/marketing-section-header';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface MarketingPricingProps {
  showFaq?: boolean;
  showCompareLink?: boolean;
}

export function MarketingPricing({ showFaq = true, showCompareLink = true }: MarketingPricingProps) {
  return (
    <MarketingSection id="pricing" band>
      <MarketingSectionHeader
        eyebrow="Pricing"
        title="Starter to scale. Built to grow."
        description="Start with a full-featured trading journal on Starter. Upgrade to Pro or Elite when you need unlimited AI review and community tools."
      />

      <MarketingPricingPlans />

      <p className="mt-6 text-center text-sm text-slate-500">
        Need more than 15 journals?{' '}
        <a
          href={SUPPORT_MAILTO}
          className="font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Contact support
        </a>{' '}
        for a custom quote.
      </p>

      {showCompareLink && (
        <p className="mt-8 text-center text-sm text-slate-500">
          Not sure which plan fits?{' '}
          <Link
            href="/pricing#compare"
            className="font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Compare Edgewise vs alternatives
            <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </p>
      )}

      {showFaq && <MarketingPricingFaq />}
    </MarketingSection>
  );
}
