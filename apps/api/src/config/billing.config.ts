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

const billingConfig = {
  provider: provider === 'polar' || (hasPolarToken && provider !== 'mock') ? 'polar' : 'mock',
  featureToPolarSlug,
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
