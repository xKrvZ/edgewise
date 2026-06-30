import { filterHiddenPlatformFeatures } from '@/lib/product-visibility';

/**
 * Internal Edgewise feature slugs — mirror of API PLATFORM_FEATURES.
 * Polar benefit slugs are mapped server-side; the web app only consumes feature lists from the API.
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

/** Minimum feature required for general app access. */
export const DEFAULT_ACCESS_FEATURE: PlatformFeature = 'journal';

export function isPlatformFeature(value: string): value is PlatformFeature {
  return (PLATFORM_FEATURES as readonly string[]).includes(value);
}

export const FEATURE_LABELS: Record<PlatformFeature, string> = {
  journal: 'Journal',
  analytics: 'Analytics',
  ai_review: 'AI Review',
  replay: 'Replay',
  backtest: 'Backtesting',
  community: 'Communities',
};

export function formatFeatureList(features: PlatformFeature[]): string {
  const visibleFeatures = filterHiddenPlatformFeatures(features);
  if (visibleFeatures.length === 0) {
    return 'No features enabled';
  }
  return visibleFeatures.map((feature) => FEATURE_LABELS[feature] ?? feature).join(', ');
}
