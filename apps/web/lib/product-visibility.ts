/**
 * Temporary product visibility toggles.
 * Set `SHOW_BACKTEST_AND_REPLAY` to `true` to restore backtest & replay across the web app.
 */
export const SHOW_BACKTEST_AND_REPLAY = false;

export const HIDDEN_PLATFORM_FEATURE_SLUGS = ['replay', 'backtest'] as const;

export const HIDDEN_MARKETING_SPOTLIGHT_IDS = ['trade-replay', 'backtesting'] as const;

export const HIDDEN_COMPARISON_FEATURE_NAMES = ['Trade replay', 'Backtesting journal'] as const;

export function filterHiddenPlatformFeatures<T extends string>(features: T[]): T[] {
  if (SHOW_BACKTEST_AND_REPLAY) return features;
  return features.filter(
    (feature) => !(HIDDEN_PLATFORM_FEATURE_SLUGS as readonly string[]).includes(feature),
  );
}

export function pricingFeatureVisible(feature: string): boolean {
  if (SHOW_BACKTEST_AND_REPLAY) return true;
  return !/\b(replay|backtest)/i.test(feature);
}
