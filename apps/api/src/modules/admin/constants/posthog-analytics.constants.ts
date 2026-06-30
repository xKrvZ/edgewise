/**
 * PostHog events that power /admin/analytics charts.
 * Keep in sync with apps/web/lib/posthog.ts (AnalyticsEvents).
 *
 * | Section     | Chart / metric              | Event(s)                          |
 * |-------------|-----------------------------|-----------------------------------|
 * | Acquisition | User signups                | user_signed_up                    |
 * | Acquisition | Pageviews (optional)        | $pageview                         |
 * | Activation  | Journals created            | journal_created                   |
 * | Activation  | Trades logged               | trade_logged                      |
 * | Activation  | First trades                | first_trade_imported, trade_logged (count=1) |
 * | Activation  | Community joins             | community_joined                  |
 * | Conversion  | Checkout started            | checkout_started                  |
 * | Conversion  | Subscriptions completed     | subscription_completed            |
 * | Churn       | Cancellations               | (not tracked — empty series)      |
 * | Revenue     | Dollar revenue              | (not tracked — empty series)      |
 * | Funnels     | Activation funnel steps     | see posthog-funnel.constants.ts   |
 */
export const POSTHOG_ANALYTICS_EVENTS = {
  signups: 'user_signed_up',
  pageviews: '$pageview',
  journals: 'journal_created',
  trades: 'trade_logged',
  firstTradeImported: 'first_trade_imported',
  communityJoins: 'community_joined',
  checkoutStarted: 'checkout_started',
  subscriptionsCompleted: 'subscription_completed',
} as const;

export type PostHogAnalyticsEventKey = keyof typeof POSTHOG_ANALYTICS_EVENTS;

export interface PostHogTrendSeriesDef {
  key: string;
  event: string;
  name: string;
  properties?: Record<string, unknown>[];
}

/** Daily trend series fetched in a single PostHog TrendsQuery. */
export const POSTHOG_DAILY_TREND_SERIES: PostHogTrendSeriesDef[] = [
  { key: 'signups', event: POSTHOG_ANALYTICS_EVENTS.signups, name: 'Signups' },
  {
    key: 'subscriptions',
    event: POSTHOG_ANALYTICS_EVENTS.subscriptionsCompleted,
    name: 'Subscriptions',
  },
  {
    key: 'checkoutStarted',
    event: POSTHOG_ANALYTICS_EVENTS.checkoutStarted,
    name: 'Checkout started',
  },
  { key: 'journals', event: POSTHOG_ANALYTICS_EVENTS.journals, name: 'Journals' },
  { key: 'trades', event: POSTHOG_ANALYTICS_EVENTS.trades, name: 'Trades' },
  {
    key: 'firstTradeImported',
    event: POSTHOG_ANALYTICS_EVENTS.firstTradeImported,
    name: 'First trade (import)',
  },
  {
    key: 'firstTradeLogged',
    event: POSTHOG_ANALYTICS_EVENTS.trades,
    name: 'First trade (manual)',
    properties: [
      {
        key: 'trade_count',
        type: 'event',
        value: ['1'],
        operator: 'exact',
      },
    ],
  },
  {
    key: 'communityJoins',
    event: POSTHOG_ANALYTICS_EVENTS.communityJoins,
    name: 'Community joins',
  },
];
