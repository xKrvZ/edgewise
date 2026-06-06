import { MarketingAiReviewSection } from '@/components/marketing/marketing-ai-review-section';
import { MarketingBlog } from '@/components/marketing/marketing-blog';
import { MarketingComparisonTeaser } from '@/components/marketing/marketing-comparison-teaser';
import { MarketingCtaBand } from '@/components/marketing/marketing-cta-band';
import { MarketingFaq } from '@/components/marketing/marketing-faq';
import { MarketingFeatureGrid } from '@/components/marketing/marketing-feature-grid';
import { MarketingFeatureSpotlights } from '@/components/marketing/marketing-feature-spotlights';
import { MarketingHero } from '@/components/marketing/marketing-hero';
import { MarketingHowItWorks } from '@/components/marketing/marketing-how-it-works';
import { MarketingJsonLd } from '@/components/marketing/marketing-json-ld';
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell';
import { MarketingPricing } from '@/components/marketing/marketing-pricing';
import { MarketingReplaySection } from '@/components/marketing/marketing-replay-section';
import { MarketingResources } from '@/components/marketing/marketing-resources';
import { MarketingStatsRow } from '@/components/marketing/marketing-stats-row';
import { MarketingTrustedBy } from '@/components/marketing/marketing-trusted-by';
import { MarketingUseCases } from '@/components/marketing/marketing-use-cases';
import { MARKETING_SEO, marketingCanonicalUrl } from '@/components/marketing/marketing-seo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: MARKETING_SEO.title },
  description: MARKETING_SEO.description,
  keywords: [...MARKETING_SEO.keywords],
  alternates: {
    canonical: marketingCanonicalUrl('/'),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: marketingCanonicalUrl('/'),
    siteName: 'Edgewise',
    title: MARKETING_SEO.title,
    description: MARKETING_SEO.description,
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
    title: MARKETING_SEO.title,
    description: MARKETING_SEO.description,
    images: [marketingCanonicalUrl(MARKETING_SEO.ogImage)],
  },
};

export default function Home() {
  return (
    <MarketingPageShell>
      <MarketingJsonLd />
      <main id="main-content" className="relative z-10">
        <MarketingHero />
        <MarketingTrustedBy />
        <MarketingAiReviewSection />
        <MarketingFeatureGrid />
        <MarketingFeatureSpotlights />
        <MarketingUseCases />
        <MarketingHowItWorks />
        <MarketingReplaySection />
        <MarketingStatsRow />
        <MarketingComparisonTeaser />
        <MarketingPricing showFaq={false} />
        <MarketingFaq />
        <MarketingBlog />
        <MarketingResources />
        <MarketingCtaBand />
      </main>
    </MarketingPageShell>
  );
}
