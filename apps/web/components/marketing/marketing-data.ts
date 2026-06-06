import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BookOpen,
  FileText,
  LifeBuoy,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';

export const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Compare', href: '/pricing#compare' },
  { label: 'FAQ', href: '/#faq' },
] as const;

export interface TrustedFirm {
  name: string;
  logo: string;
  alt: string;
  width: number;
  height: number;
}

export const TRUSTED_FIRMS: TrustedFirm[] = [
  {
    name: 'Topstep',
    logo: '/marketing/logos/topstep.svg',
    alt: 'Topstep logo',
    width: 132,
    height: 32,
  },
  {
    name: 'Apex',
    logo: '/marketing/logos/apex.svg',
    alt: 'Apex Trader Funding logo',
    width: 108,
    height: 32,
  },
  {
    name: 'FTMO',
    logo: '/marketing/logos/ftmo.svg',
    alt: 'FTMO logo',
    width: 88,
    height: 32,
  },
  {
    name: 'Bulenox',
    logo: '/marketing/logos/bulenox.svg',
    alt: 'Bulenox logo',
    width: 128,
    height: 32,
  },
  {
    name: 'Earn2Trade',
    logo: '/marketing/logos/earn2trade.svg',
    alt: 'Earn2Trade logo',
    width: 148,
    height: 32,
  },
];

export interface AiInsightCard {
  label: string;
  value: string;
}

export const AI_INSIGHT_CARDS: AiInsightCard[] = [
  { label: 'Biggest Strength', value: 'Trend following' },
  { label: 'Biggest Weakness', value: 'Revenge trading' },
  { label: 'Focus This Week', value: 'Improve patience' },
];

export interface MarketingFeature {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: 'indigo' | 'emerald' | 'sky' | 'amber' | 'rose';
}

export const FEATURE_GRID: MarketingFeature[] = [
  {
    icon: TrendingUp,
    title: 'Journal & Track',
    description:
      'Log futures, forex, and prop firm trades with notes, mistakes, emotions, and screenshots.',
    accent: 'indigo',
  },
  {
    icon: Play,
    title: 'Trade Replay',
    description: 'Rewind every decision tick-by-tick and see what you missed in the moment.',
    accent: 'sky',
  },
  {
    icon: BarChart3,
    title: 'Trading Analytics',
    description: 'Surface win rate, expectancy, and setup patterns in a performance tracker.',
    accent: 'emerald',
  },
  {
    icon: Sparkles,
    title: 'AI Trade Review',
    description: 'Get automated feedback on behaviour, discipline, and recurring mistakes.',
    accent: 'amber',
  },
  {
    icon: Target,
    title: 'Improve & Scale',
    description: 'Follow playbooks, track prop firm rules, and build consistent habits.',
    accent: 'rose',
  },
];

export interface FeatureSpotlight {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  image: string;
  imageAlt: string;
  reversed?: boolean;
}

export const FEATURE_SPOTLIGHTS: FeatureSpotlight[] = [
  {
    id: 'trade-replay',
    eyebrow: 'Trade replay',
    title: 'Replay sessions like you were still at the desk',
    description:
      'Edgewise trade replay lets futures and forex day traders scrub through every candle, entry, and exit. Stop guessing why a trade failed — watch the market unfold in context.',
    bullets: [
      'Tick-by-tick and candle-by-candle replay',
      'Mark entries, exits, and journal notes on the chart',
      'Replay full trading days or single setups',
      'Pair replay with screenshots and emotions',
    ],
    image: '/marketing/blog-replay.png',
    imageAlt: 'Trade replay chart showing candlestick playback for a futures session',
  },
  {
    id: 'ai-review',
    eyebrow: 'AI trade review',
    title: 'Personalized feedback without the guesswork',
    description:
      'Our AI trade review scans your journal for patterns humans miss — revenge trading, oversizing, and time-of-day edges. Get a weekly focus area, not generic tips.',
    bullets: [
      'Strengths and weaknesses surfaced automatically',
      'Behavioural patterns across sessions',
      'Actionable focus areas for the week ahead',
      'Works with your existing journal entries',
    ],
    image: '/marketing/ai-review-insight.png',
    imageAlt: 'AI trade review insight cards highlighting trader strengths and weaknesses',
    reversed: true,
  },
  {
    id: 'analytics',
    eyebrow: 'Trading analytics',
    title: 'A performance tracker built for serious review',
    description:
      'Go beyond win rate. Edgewise trading analytics connect setups, tags, mistakes, and outcomes so you know which edges are real — and which are noise.',
    bullets: [
      'Win rate, expectancy, profit factor, and R-multiples',
      'Filter by instrument, session, tag, or playbook',
      'Equity curve and drawdown visualization',
      'Shareable stats for mentors and communities',
    ],
    image: '/marketing/hero-dashboard.png',
    imageAlt: 'Trading analytics dashboard with equity curve and performance metrics',
  },
  {
    id: 'community',
    eyebrow: 'Community & mentorship',
    title: 'Accountability that compounds with your crew',
    description:
      'Trading alone is hard. Edgewise communities and leaderboards keep prop firm challengers and mentor groups aligned on review habits — without exposing private trade details.',
    bullets: [
      'Private communities for mentors and trading groups',
      'Leaderboards driven by review consistency',
      'Share playbooks and public trader profiles',
      'Invite-only spaces for prop firm cohorts',
    ],
    image: '/marketing/blog-journal.png',
    imageAlt: 'Trading community leaderboard and shared journal workflow',
    reversed: true,
  },
  {
    id: 'backtesting',
    eyebrow: 'Backtesting journal',
    title: 'Bridge backtests and live trading in one journal',
    description:
      'Most traders split backtesting from live review. Edgewise keeps both in one backtesting journal so you can compare simulated setups against real execution.',
    bullets: [
      'Log backtest trades alongside live journal entries',
      'Compare backtest vs. live performance metrics',
      'Tag setups and mistakes across both modes',
      'Build playbooks from validated backtest data',
    ],
    image: '/marketing/blog-psychology.png',
    imageAlt: 'Backtesting journal comparing simulated and live trade performance',
  },
];

export const FEATURE_ACCENT_STYLES: Record<
  MarketingFeature['accent'],
  { icon: string; ring: string }
> = {
  indigo: { icon: 'bg-primary/10 text-primary border-primary/20', ring: 'group-hover:ring-primary/20' },
  sky: { icon: 'bg-sky-100 text-sky-600 border-sky-200', ring: 'group-hover:ring-sky-200' },
  emerald: { icon: 'bg-emerald-100 text-emerald-600 border-emerald-200', ring: 'group-hover:ring-emerald-200' },
  amber: { icon: 'bg-amber-100 text-amber-600 border-amber-200', ring: 'group-hover:ring-amber-200' },
  rose: { icon: 'bg-rose-100 text-rose-600 border-rose-200', ring: 'group-hover:ring-rose-200' },
};

export const REPLAY_BENEFITS = [
  'Tick-by-tick replay',
  'Mark entries, exits, and notes',
  'Analyze mistakes in context',
  'Replay full trading days',
] as const;

export interface OutcomeStat {
  value: string;
  label: string;
}

export const OUTCOME_STATS: OutcomeStat[] = [
  { value: '62%', label: 'Traders report sharper review habits after 90 days of journaling' },
  { value: '4.3x', label: 'More profitable setups found via trade replay and analytics' },
  { value: '3 min', label: 'Average daily trade journal review — built for busy day traders' },
  { value: '100%', label: 'Accountability across prop firm, futures, and forex accounts' },
];

export interface UseCase {
  title: string;
  description: string;
  highlights: string[];
}

export const USE_CASES: UseCase[] = [
  {
    title: 'Day traders',
    description:
      'Futures and forex day traders who need a fast trade journal software workflow between sessions.',
    highlights: [
      'Log trades with screenshots in under a minute',
      'Replay the open, lunch, and close separately',
      'Track setup win rate by session and instrument',
    ],
  },
  {
    title: 'Prop firm challengers',
    description:
      'Pass evals and stay funded with a prop firm trading journal that tracks rules, drawdown, and consistency.',
    highlights: [
      'Separate accounts per prop firm and phase',
      'Monitor daily loss limits and consistency targets',
      'Review rule breaks with trade replay context',
    ],
  },
  {
    title: 'Mentors & communities',
    description:
      'Coaches and trading groups who want structured review without sharing raw P&L.',
    highlights: [
      'Private communities with review leaderboards',
      'Share playbooks and anonymized stats',
      'Guide members through AI-assisted weekly reviews',
    ],
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is a trading journal and why do I need one?',
    answer:
      'A trading journal is a structured log of every trade you take — entries, exits, setup, emotions, and outcome. Serious traders use trade journal software to spot patterns, fix recurring mistakes, and measure whether their edge is real. Edgewise combines journaling with replay, analytics, and AI trade review so review takes minutes, not hours.',
  },
  {
    question: 'Is Edgewise good for prop firm trading?',
    answer:
      'Yes. Edgewise is built as a prop firm trading journal. Track multiple eval and funded accounts, monitor drawdown and consistency rules, and replay sessions when you break a rule. Many traders use it alongside Topstep, Apex, FTMO, and similar programs.',
  },
  {
    question: 'How does trade replay work?',
    answer:
      'Trade replay lets you scrub through historical price action tick-by-tick or candle-by-candle, synced with your journal entries. Mark where you entered, exited, and what you were thinking. It is one of the fastest ways to fix revenge trading, early exits, and missed context.',
  },
  {
    question: 'What does AI trade review analyze?',
    answer:
      'AI trade review reads your journal data — tags, mistakes, times, outcomes — and surfaces behavioural patterns like oversizing, session-specific edges, and recurring errors. You get a weekly focus area instead of generic trading tips.',
  },
  {
    question: 'Can I use Edgewise for futures and forex day trading?',
    answer:
      'Absolutely. Edgewise supports futures, forex, and other intraday markets. Log trades with screenshots, tag setups, and filter analytics by instrument or session. The workflow is tuned for day traders who review between sessions.',
  },
  {
    question: 'Is there a free plan?',
    answer:
      'Yes. The Free plan includes unlimited trade journal entries, trade replay, basic trading analytics, and limited AI trade review — no credit card required. Pro and Team tiers with advanced features are coming soon.',
  },
  {
    question: 'Does Edgewise include backtesting?',
    answer:
      'Edgewise includes a backtesting journal so you can log simulated trades alongside live ones. Compare backtest vs. live performance, tag setups across both, and build playbooks from validated data.',
  },
  {
    question: 'How is Edgewise different from Tradervue or traditional journals?',
    answer:
      'Edgewise combines trade journaling, tick-by-tick replay, AI trade review, prop firm tracking, community tools, and backtesting in one platform — with a generous free tier. See our detailed comparison on the pricing page for a feature-by-feature breakdown.',
  },
];

export interface HowItWorksStep {
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: 1,
    icon: BookOpen,
    title: 'Journal',
    description: 'Log every trade with notes, screenshots, and emotions.',
  },
  {
    step: 2,
    icon: Play,
    title: 'Replay',
    description: 'Rewind decisions tick-by-tick and see what you missed.',
  },
  {
    step: 3,
    icon: BarChart3,
    title: 'Analytics',
    description: 'Surface patterns, strengths, and weaknesses in your data.',
  },
  {
    step: 4,
    icon: Target,
    title: 'Improve',
    description: 'Build better habits and follow your playbook consistently.',
  },
];

export interface PricingPlan {
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
  comingSoon?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Free',
    monthlyPrice: '$0',
    annualPrice: '$0',
    period: 'forever',
    description: 'Full trade journal software to start logging, replaying, and reviewing today.',
    features: [
      'Unlimited trade journal entries',
      'Trade replay & screenshots',
      'Basic trading analytics dashboard',
      'AI trade review (limited)',
      'Prop firm account tracking',
      'Playbooks & mistake tags',
    ],
    cta: 'Start for free',
    ctaHref: '/sign-in',
    highlighted: true,
    badge: 'Recommended',
  },
  {
    name: 'Pro',
    monthlyPrice: '$29',
    annualPrice: '$24',
    period: 'per month',
    description: 'Advanced trading analytics and unlimited AI review for scaling traders.',
    features: [
      'Everything in Free',
      'Unlimited AI trade reviews',
      'Advanced analytics & filters',
      'Backtesting journal',
      'Community leaderboards',
      'Priority support',
    ],
    cta: 'Join early access',
    ctaHref: '/sign-in',
    badge: 'Coming soon',
    comingSoon: true,
  },
  {
    name: 'Team',
    monthlyPrice: '$49',
    annualPrice: '$39',
    period: 'per seat / month',
    description: 'For mentors, prop firm cohorts, and trading communities.',
    features: [
      'Everything in Pro',
      'Private community spaces',
      'Mentor dashboards & invites',
      'Shared playbooks & leaderboards',
      'Bulk member onboarding',
      'Dedicated support',
    ],
    cta: 'Join early access',
    ctaHref: '/sign-in',
    badge: 'Coming soon',
    comingSoon: true,
  },
];

export const PRICING_FAQ: FaqItem[] = [
  {
    question: 'Is there a free plan?',
    answer:
      'Yes. Edgewise Free includes unlimited trade journal entries, trade replay, basic trading analytics, and limited AI trade review. No credit card required.',
  },
  {
    question: 'Can I use Edgewise for prop firms?',
    answer:
      'Yes. Track multiple prop firm accounts, monitor drawdown and consistency rules, and replay sessions when rules are broken. Built for eval and funded phases.',
  },
  {
    question: 'When will Pro and Team launch?',
    answer:
      'Pro and Team tiers are in early access. Sign up free today and you will be first in line when paid plans launch. Early users keep founding-member pricing.',
  },
  {
    question: 'Can I switch between monthly and annual billing?',
    answer:
      'Annual billing will be available at launch with roughly 20% savings. The toggle on this page previews planned pricing — billing is not live yet.',
  },
];

export type ComparisonValue = boolean | 'partial' | 'limited';

export interface ComparisonFeature {
  name: string;
  description?: string;
  edgewise: ComparisonValue;
  otherJournal: ComparisonValue;
  tradervue: ComparisonValue;
  edgewonk: ComparisonValue;
}

export const COMPETITOR_LABELS = {
  edgewise: 'Edgewise',
  otherJournal: 'Other journals',
  tradervue: 'Tradervue',
  edgewonk: 'Edgewonk-style',
} as const;

export const COMPETITOR_COMPARISON: ComparisonFeature[] = [
  {
    name: 'Trade journal & logging',
    edgewise: true,
    otherJournal: true,
    tradervue: true,
    edgewonk: true,
  },
  {
    name: 'Trade replay',
    edgewise: true,
    otherJournal: true,
    tradervue: 'limited',
    edgewonk: false,
  },
  {
    name: 'AI trade review',
    edgewise: true,
    otherJournal: 'partial',
    tradervue: false,
    edgewonk: false,
  },
  {
    name: 'Trading analytics dashboard',
    edgewise: true,
    otherJournal: true,
    tradervue: true,
    edgewonk: 'partial',
  },
  {
    name: 'Prop firm account tracking',
    edgewise: true,
    otherJournal: 'partial',
    tradervue: 'partial',
    edgewonk: false,
  },
  {
    name: 'Community & mentorship',
    edgewise: true,
    otherJournal: 'partial',
    tradervue: false,
    edgewonk: false,
  },
  {
    name: 'Backtesting journal',
    edgewise: true,
    otherJournal: 'partial',
    tradervue: 'limited',
    edgewonk: false,
  },
  {
    name: 'Free tier',
    edgewise: true,
    otherJournal: 'limited',
    tradervue: 'limited',
    edgewonk: false,
  },
  {
    name: 'Playbooks & mistake tracking',
    edgewise: true,
    otherJournal: true,
    tradervue: 'partial',
    edgewonk: true,
  },
];

export interface BlogPost {
  title: string;
  excerpt: string;
  date: string;
  category: string;
  href: string;
  coverImage: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    title: '5 journaling habits that separate profitable traders',
    excerpt:
      'The best traders don\'t just log trades — they build a review ritual that compounds over time.',
    date: 'May 28, 2026',
    category: 'Habits',
    href: '#',
    coverImage: '/marketing/blog-journal.png',
  },
  {
    title: 'How to use trade replay to fix revenge trading',
    excerpt:
      'Replaying your worst sessions reveals the exact moment discipline breaks down.',
    date: 'May 15, 2026',
    category: 'Psychology',
    href: '#',
    coverImage: '/marketing/blog-replay.png',
  },
  {
    title: 'Reading your analytics: win rate vs. expectancy',
    excerpt:
      'A high win rate means nothing without context. Learn which metrics actually matter.',
    date: 'Apr 30, 2026',
    category: 'Analytics',
    href: '#',
    coverImage: '/marketing/blog-psychology.png',
  },
];

export interface ResourceLink {
  icon: LucideIcon;
  title: string;
  description: string;
  linkLabel: string;
  href: string;
  accent: 'indigo' | 'sky' | 'emerald' | 'amber';
}

export const RESOURCE_LINKS: ResourceLink[] = [
  {
    icon: BookOpen,
    title: 'Guides',
    description: 'Step-by-step tutorials to help you journal and review workflows.',
    linkLabel: 'Explore guides',
    href: '#',
    accent: 'indigo',
  },
  {
    icon: FileText,
    title: 'API docs',
    description: 'Integrate Edgewise with your custom tools and dashboards.',
    linkLabel: 'View docs',
    href: '#',
    accent: 'sky',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Connect with traders, share insights, and climb leaderboards.',
    linkLabel: 'Join community',
    href: '/sign-in',
    accent: 'emerald',
  },
  {
    icon: LifeBuoy,
    title: 'Support',
    description: 'Get help with your account, imports, and feature questions.',
    linkLabel: 'Get support',
    href: '#',
    accent: 'amber',
  },
];

export const RESOURCE_ACCENT_STYLES: Record<ResourceLink['accent'], { icon: string }> = {
  indigo: { icon: 'bg-primary/10 text-primary' },
  sky: { icon: 'bg-sky-100 text-sky-600' },
  emerald: { icon: 'bg-emerald-100 text-emerald-600' },
  amber: { icon: 'bg-amber-100 text-amber-600' },
};

export const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Trade replay', href: '/#trade-replay' },
      { label: 'AI trade review', href: '/#ai-review' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Compare', href: '/pricing#compare' },
      { label: 'How it works', href: '/#how-it-works' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'FAQ', href: '/#faq' },
      { label: 'Blog', href: '/#blog' },
      { label: 'Use cases', href: '/#use-cases' },
      { label: 'Guides', href: '/#resources' },
      { label: 'Support', href: '/#resources' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
] as const;
