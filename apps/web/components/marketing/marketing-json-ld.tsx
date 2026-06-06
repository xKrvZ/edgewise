import { FAQ_ITEMS } from '@/components/marketing/marketing-data';
import { MARKETING_SEO, marketingCanonicalUrl } from '@/components/marketing/marketing-seo';

interface MarketingJsonLdProps {
  includeFaq?: boolean;
}

export function MarketingJsonLd({ includeFaq = true }: MarketingJsonLdProps) {
  const url = marketingCanonicalUrl('/');

  const softwareApplication = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Edgewise',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: MARKETING_SEO.description,
    url,
    image: marketingCanonicalUrl(MARKETING_SEO.ogImage),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free forever plan with trade journaling, replay, and basic analytics',
    },
    featureList: [
      'Trade journal and performance tracking',
      'Tick-by-tick trade replay',
      'AI trade review',
      'Trading analytics dashboard',
      'Prop firm account tracking',
      'Community and mentorship tools',
      'Backtesting journal',
    ],
  };

  const webSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Edgewise',
    url,
    description: MARKETING_SEO.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const faqPage = includeFaq
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: answer,
          },
        })),
      }
    : null;

  const graph = [softwareApplication, webSite, faqPage].filter(Boolean);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': graph,
        }),
      }}
    />
  );
}
