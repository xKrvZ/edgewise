import { MarketingComparisonTable } from '@/components/marketing/marketing-comparison-table';
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band';
import { MarketingJsonLd } from '@/components/marketing/marketing-json-ld';
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell';
import { MarketingPricing } from '@/components/marketing/marketing-pricing';
import { MarketingSection, marketingSectionContentClass } from '@/components/marketing/marketing-section';
import { MarketingSectionHeader } from '@/components/marketing/marketing-section-header';
import {
  MARKETING_SEO,
  PRICING_SEO,
  marketingCanonicalUrl,
} from '@/components/marketing/marketing-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: PRICING_SEO.title },
  description: PRICING_SEO.description,
  keywords: [...PRICING_SEO.keywords],
  alternates: {
    canonical: marketingCanonicalUrl('/pricing'),
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: marketingCanonicalUrl('/pricing'),
    siteName: 'Edgewise',
    title: PRICING_SEO.title,
    description: PRICING_SEO.description,
    images: [
      {
        url: marketingCanonicalUrl(MARKETING_SEO.ogImage),
        width: 1200,
        height: 750,
        alt: MARKETING_SEO.ogImageAlt,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: PRICING_SEO.title,
    description: PRICING_SEO.description,
    images: [marketingCanonicalUrl(MARKETING_SEO.ogImage)],
  },
};

export default function PricingPage() {
  return (
    <MarketingPageShell>
      <MarketingJsonLd includeFaq={false} />
      <main id="main-content" className="relative z-10">
        <MarketingSection hero>
          <MarketingSectionHeader
            eyebrow="Pricing & compare"
            title="Plans for every stage of your trading journey"
            description="Start free with a full trading journal. Compare Edgewise to TradeZella, Tradervue, and traditional journals — then pick the plan that fits."
            align="center"
          />
        </MarketingSection>

        <MarketingPricing showCompareLink={false} />

        <MarketingSection id="compare">
          <MarketingSectionHeader
            eyebrow="Compare"
            title="Edgewise vs other trading journals"
            description="A factual feature comparison across trade replay, AI review, prop firm tracking, backtesting, and free tiers."
          />
          <div className={marketingSectionContentClass}>
            <MarketingComparisonTable />
          </div>
        </MarketingSection>

        <MarketingCtaBand />
      </main>
    </MarketingPageShell>
  );
}
