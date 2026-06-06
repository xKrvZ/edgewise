import { Injectable } from '@nestjs/common';
import billingConfig from '@/config/billing.config';
import {
  DEFAULT_ACCESS_FEATURE,
  type PlatformFeature,
} from '../constants/features.constants';
import type { FeatureProvider, FeatureProviderKind } from '../interfaces/feature-provider.interface';
import { MockFeatureProvider } from '../providers/mock-feature.provider';
import { PolarFeatureProvider } from '../providers/polar-feature.provider';

@Injectable()
export class FeatureAccessService {
  private readonly provider: FeatureProvider;

  constructor(
    mockFeatureProvider: MockFeatureProvider,
    polarFeatureProvider: PolarFeatureProvider,
  ) {
    this.provider =
      billingConfig.provider === 'polar' ? polarFeatureProvider : mockFeatureProvider;
  }

  getProviderKind(): FeatureProviderKind {
    return this.provider.kind;
  }

  isMockMode(): boolean {
    return this.provider.kind === 'mock';
  }

  async hasFeature(
    userId: string,
    feature: PlatformFeature,
    email?: string | null,
  ): Promise<boolean> {
    return this.provider.hasFeature(userId, feature, email);
  }

  async hasPlatformAccess(userId: string, email?: string | null): Promise<boolean> {
    return this.hasFeature(userId, DEFAULT_ACCESS_FEATURE, email);
  }

  async listFeatures(userId: string, email?: string | null): Promise<PlatformFeature[]> {
    return this.provider.listFeatures(userId, email);
  }
}
