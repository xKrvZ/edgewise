/**
 * Polar billing configuration (via @polar-sh/better-auth plugin).
 *
 * Polar setup (production):
 * 1. Create a subscription product in the Polar dashboard.
 * 2. Attach benefits with metadata slugs matching featureToPolarSlug values (see below).
 * 3. Add a webhook endpoint → `https://<api-host>/api/auth/polar/webhooks`
 *    (handled by the Better Auth Polar plugin).
 * 4. Copy the webhook secret, organization access token, and product ID
 *    into the env vars below.
 *
 * Access control uses internal Edgewise feature slugs (journal, analytics, …).
 * Polar benefit metadata slugs are mapped via featureToPolarSlug — override per
 * feature with FEATURE_<NAME>_POLAR_SLUG env vars.
 *
 * Local dev: set `BILLING_PROVIDER=mock` (default when Polar keys are absent)
 * to grant all features to authenticated users.
 */
import {
  DEFAULT_POLAR_FEATURE_MAP,
  type PlatformFeature,
} from '@/modules/billing/constants/features.constants';

const provider = (process.env.BILLING_PROVIDER ?? '').toLowerCase();
const hasPolarToken = Boolean(process.env.POLAR_ACCESS_TOKEN?.trim());

function envFeatureSlug(feature: PlatformFeature): string | undefined {
  const key = `FEATURE_${feature.toUpperCase()}_POLAR_SLUG`;
  return process.env[key]?.trim() || undefined;
}

const featureToPolarSlug = Object.fromEntries(
  (Object.keys(DEFAULT_POLAR_FEATURE_MAP) as PlatformFeature[]).map((feature) => [
    feature,
    envFeatureSlug(feature) ?? DEFAULT_POLAR_FEATURE_MAP[feature],
  ]),
) as Record<PlatformFeature, string>;

/** Polar checkout product slug — defaults to the journal feature's Polar slug. */
const checkoutSlug =
  process.env.POLAR_CHECKOUT_SLUG?.trim() ||
  process.env.POLAR_ENTITLEMENT_SLUG?.trim() ||
  featureToPolarSlug.journal;

/** Billing plan identifiers used for per-account limits. */
export type BillingPlanId = 'starter' | 'pro' | 'elite';

/** User-facing plan labels (title case). */
export const BILLING_PLAN_LABELS: Record<BillingPlanId, string> = {
  starter: 'Starter',
  pro: 'Pro',
  elite: 'Elite',
};

/**
 * Trading accounts included per subscription plan.
 * Pricing is per-account — each plan includes a fixed number of trade journals.
 *
 * | Plan    | maxAccounts | Price (USD)   | Typical use                          |
 * |---------|-------------|---------------|--------------------------------------|
 * | starter | 1           | $10/mo ($8/mo annual) | Single journal, core platform access |
 * | pro     | 5           | $29/mo        | Multiple accounts, full feature set  |
 * | elite   | 15          | $49/mo        | Power users / multi-strategy traders |
 */
export const PLAN_ACCOUNT_LIMITS: Record<BillingPlanId, number> = {
  starter: 1,
  pro: 5,
  elite: 15,
};

/**
 * On-demand AI review tokens included per subscription plan (monthly allowance).
 * `null` = unlimited (Elite).
 *
 * | Plan    | tokens/month | Notes                          |
 * |---------|--------------|--------------------------------|
 * | starter | 10           | Core journaling + limited AI   |
 * | pro     | 100          | Full feature set               |
 * | elite   | unlimited    | No deduction, always allowed   |
 */
export const PLAN_AI_REVIEW_TOKEN_LIMITS: Record<BillingPlanId, number | null> = {
  starter: 10,
  pro: 100,
  elite: null,
};

/** Tokens consumed per on-demand trade AI review request. */
export const AI_REVIEW_TOKEN_COST = 1;

/** Maps Polar product IDs to billing plans (extend via POLAR_PRODUCT_ID env). */
function buildProductIdToPlan(): Record<string, BillingPlanId> {
  const map: Record<string, BillingPlanId> = {};
  const productId = process.env.POLAR_PRODUCT_ID?.trim();
  if (productId) {
    map[productId] = 'pro';
  }
  const eliteProductId =
    process.env.POLAR_ELITE_PRODUCT_ID?.trim() || process.env.POLAR_TEAM_PRODUCT_ID?.trim();
  if (eliteProductId) {
    map[eliteProductId] = 'elite';
  }
  const starterProductId = process.env.POLAR_STARTER_PRODUCT_ID?.trim();
  if (starterProductId) {
    map[starterProductId] = 'starter';
  }
  return map;
}

const billingConfig = {
  provider: provider === 'polar' || (hasPolarToken && provider !== 'mock') ? 'polar' : 'mock',
  featureToPolarSlug,
  planAccountLimits: PLAN_ACCOUNT_LIMITS,
  planAiReviewTokenLimits: PLAN_AI_REVIEW_TOKEN_LIMITS,
  aiReviewTokenCost: AI_REVIEW_TOKEN_COST,
  productIdToPlan: buildProductIdToPlan(),
  /** Default plan when mock billing grants access without a stored productId. */
  mockDefaultPlan: (process.env.MOCK_BILLING_PLAN?.trim() || 'pro') as BillingPlanId,
  /** Plan assigned to the demo seed user (unlimited-tier cap). */
  demoPlan: 'elite' as BillingPlanId,
  polar: {
    accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? '',
    productId: process.env.POLAR_PRODUCT_ID ?? '',
    /** Checkout product slug (Better Auth checkout({ slug })). */
    checkoutSlug,
    /** @deprecated Use checkoutSlug — kept for backward-compatible env/docs. */
    entitlementSlug: checkoutSlug,
    /** Required for Polar orders/revenue admin metrics via the SDK. */
    organizationId: process.env.POLAR_ORGANIZATION_ID ?? '',
    server: (process.env.POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production') as
      | 'sandbox'
      | 'production',
  },
  /** Demo account always has full platform access (seed + runtime bypass). */
  demoUserEmail: 'demo@tradejournal.app',
};

export default billingConfig;
