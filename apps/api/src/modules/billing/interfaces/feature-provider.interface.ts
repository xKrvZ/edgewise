import type { PlatformFeature } from '../constants/features.constants';

export type FeatureProviderKind = 'mock' | 'polar';

export interface FeatureProvider {
  readonly kind: FeatureProviderKind;

  hasFeature(
    userId: string,
    feature: PlatformFeature,
    email?: string | null,
  ): Promise<boolean>;

  listFeatures(userId: string, email?: string | null): Promise<PlatformFeature[]>;
}
