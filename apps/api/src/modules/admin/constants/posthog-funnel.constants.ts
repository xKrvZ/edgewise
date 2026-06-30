/**
 * Activation funnel steps aligned with frontend PostHog events (apps/web/lib/posthog.ts).
 */
export const POSTHOG_ACTIVATION_FUNNEL_STEPS = [
  {
    key: 'signed_up',
    label: 'Signed up',
    shortLabel: 'Signed up',
    event: 'user_signed_up',
  },
  {
    key: 'onboarding',
    label: 'Completed onboarding',
    shortLabel: 'Onboarding',
    event: 'onboarding_completed',
  },
  {
    key: 'first_journal',
    label: 'Created first journal',
    shortLabel: 'First journal',
    event: 'journal_created',
    properties: [
      {
        key: 'is_first',
        type: 'event',
        value: ['true'],
        operator: 'exact',
      },
    ],
  },
  {
    key: 'first_trade',
    label: 'Logged first trade',
    shortLabel: 'First trade',
    event: 'first_trade_group',
    group: {
      operator: 'OR',
      nodes: [
        {
          kind: 'EventsNode',
          event: 'trade_logged',
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
          kind: 'EventsNode',
          event: 'first_trade_imported',
        },
      ],
    },
  },
  {
    key: 'trades_milestone',
    label: '10+ trades logged',
    shortLabel: '10+ trades',
    event: 'trades_milestone_10',
  },
  {
    key: 'community',
    label: 'Joined a community',
    shortLabel: 'Community',
    event: 'community_joined',
  },
  {
    key: 'subscription',
    label: 'Subscribed',
    shortLabel: 'Subscribed',
    event: 'subscription_completed',
  },
] as const;

export type PostHogActivationFunnelStepDef = (typeof POSTHOG_ACTIVATION_FUNNEL_STEPS)[number];
