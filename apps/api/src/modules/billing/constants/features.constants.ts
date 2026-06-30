import type { BillingPlanId } from '@/config/billing.config';

/**
 * Internal Edgewise feature slugs — used for subscription gating across API and web.
 * Polar benefit metadata slugs are mapped to these via billing.config featureToPolarSlug.
 */
export const PLATFORM_FEATURES = [
  'journal',
  'analytics',
  'ai_review',
  'replay',
  'backtest',
  'community',
] as const;

export type PlatformFeature = (typeof PLATFORM_FEATURES)[number];

/** Minimum feature required for general app access (subscription guard default). */
export const DEFAULT_ACCESS_FEATURE: PlatformFeature = 'journal';

export const DEFAULT_POLAR_FEATURE_MAP: Record<PlatformFeature, string> = {
  journal: 'pro',
  analytics: 'analytics',
  ai_review: 'ai_review',
  replay: 'replay',
  backtest: 'backtest',
  community: 'community',
};

export function isPlatformFeature(value: string): value is PlatformFeature {
  return (PLATFORM_FEATURES as readonly string[]).includes(value);
}

export function polarSlugToFeature(
  slug: string,
  featureToPolarSlug: Record<PlatformFeature, string>,
): PlatformFeature | null {
  const normalized = slug.trim().toLowerCase();
  for (const feature of PLATFORM_FEATURES) {
    if (featureToPolarSlug[feature].toLowerCase() === normalized) {
      return feature;
    }
  }
  return null;
}

export function polarSlugsToFeatures(
  slugs: Iterable<string>,
  featureToPolarSlug: Record<PlatformFeature, string>,
): PlatformFeature[] {
  const features = new Set<PlatformFeature>();
  for (const slug of slugs) {
    const feature = polarSlugToFeature(slug, featureToPolarSlug);
    if (feature) {
      features.add(feature);
    }
  }
  return [...features];
}

const PREMIUM_FEATURES: PlatformFeature[] = ['analytics', 'ai_review', 'replay', 'backtest'];

/** Feature set granted for admin local plan overrides (billing excluded). */
export function featuresForBillingPlan(planId: BillingPlanId | 'none'): PlatformFeature[] {
  if (planId === 'none') {
    return [];
  }
  if (planId === 'starter') {
    return ['journal'];
  }
  if (planId === 'pro') {
    return ['journal', ...PREMIUM_FEATURES];
  }
  return [...PLATFORM_FEATURES];
}
