import { MarketingPricingFaq } from '@/components/marketing/marketing-pricing-faq';
import { MarketingPricingPlans } from '@/components/marketing/marketing-pricing-plans';
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
        title="Free to start. Built to scale."
        description="Start with a full-featured trading journal today. Upgrade to Pro or Team when you need unlimited AI review and community tools."
      />

      <MarketingPricingPlans />

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
