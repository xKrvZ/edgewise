/** Asset classes aligned with trade `marketType` values for cross-reference. */
export const ASSET_CLASSES = [
  'stocks',
  'futures',
  'forex',
  'crypto',
  'options',
] as const;
export type AssetClass = (typeof ASSET_CLASSES)[number];
