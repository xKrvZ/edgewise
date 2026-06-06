export const SITE_NAME = 'Edgewise';

export const MARKETING_KEYWORDS = [
  'trading journal',
  'trade journal software',
  'prop firm trading journal',
  'trade replay',
  'trading analytics',
  'AI trade review',
  'backtesting journal',
  'trading performance tracker',
  'futures day trading journal',
  'forex day trading journal',
] as const;

export const MARKETING_SEO = {
  title: 'Edgewise — Trading Journal, Trade Replay & Analytics for Prop Firm Traders',
  description:
    'Edgewise is trade journal software for futures, forex, and prop firm traders. Log trades, replay sessions, run AI trade review, and track performance.',
  keywords: [...MARKETING_KEYWORDS],
  ogImage: '/marketing/hero-dashboard.png',
  ogImageAlt: 'Edgewise trading journal dashboard with analytics and trade replay',
} as const;

export const PRICING_SEO = {
  title: 'Pricing — Edgewise Trading Journal & Analytics',
  description:
    'Compare Edgewise plans and alternatives. Free trade journal with replay, AI review, and prop firm tracking. Pro and Team tiers coming soon.',
  keywords: [
    'trading journal pricing',
    'trade journal software comparison',
    'free trading journal',
    'TradeZella alternative',
    'Tradervue alternative',
    ...MARKETING_KEYWORDS,
  ],
} as const;

export function marketingCanonicalUrl(path = '/'): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://edgewise.app';
  return `${base}${path}`;
}
