import { Injectable } from '@nestjs/common';
import billingConfig from '@/config/billing.config';
import {
  PLATFORM_FEATURES,
  type PlatformFeature,
} from '../constants/features.constants';
import type { FeatureProvider } from '../interfaces/feature-provider.interface';
import { SubscriptionDao } from '../daos/subscription.dao';

function resolveMockFeatures(): PlatformFeature[] {
  const raw = process.env.MOCK_FEATURES?.trim();
  if (!raw || raw.toLowerCase() === 'all') {
    return [...PLATFORM_FEATURES];
  }

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is PlatformFeature =>
      (PLATFORM_FEATURES as readonly string[]).includes(value),
    );
}

@Injectable()
export class MockFeatureProvider implements FeatureProvider {
  readonly kind = 'mock' as const;

  private readonly mockFeatures = resolveMockFeatures();

  constructor(private readonly subscriptionDao: SubscriptionDao) {}

  async hasFeature(
    userId: string,
    _feature: PlatformFeature,
    email?: string | null,
  ): Promise<boolean> {
    const features = await this.listFeatures(userId, email);
    return features.includes(_feature);
  }

  async listFeatures(userId: string, email?: string | null): Promise<PlatformFeature[]> {
    if (email === billingConfig.demoUserEmail) {
      return [...PLATFORM_FEATURES];
    }

    const stored = await this.subscriptionDao.findByUserId(userId);
    if (stored && stored.status !== 'active') {
      return [];
    }

    return [...this.mockFeatures];
  }
}
