import { Injectable, Logger } from '@nestjs/common';
import { createPolarClient } from '@/auth/polar.plugin';
import billingConfig from '@/config/billing.config';
import {
  polarSlugsToFeatures,
  type PlatformFeature,
} from '../constants/features.constants';
import type { FeatureProvider } from '../interfaces/feature-provider.interface';
import {
  asCustomerStateLike,
  extractEntitlementSlugs,
  hasEntitlementAccess,
} from '../utils/polar-entitlements.utils';

@Injectable()
export class PolarFeatureProvider implements FeatureProvider {
  readonly kind = 'polar' as const;

  private readonly logger = new Logger(PolarFeatureProvider.name);

  async hasFeature(
    userId: string,
    feature: PlatformFeature,
    email?: string | null,
  ): Promise<boolean> {
    const features = await this.listFeatures(userId, email);
    return features.includes(feature);
  }

  async listFeatures(userId: string, email?: string | null): Promise<PlatformFeature[]> {
    if (email === billingConfig.demoUserEmail) {
      return polarSlugsToFeatures(
        Object.values(billingConfig.featureToPolarSlug),
        billingConfig.featureToPolarSlug,
      );
    }

    const state = await this.fetchCustomerState(userId);
    const record = asCustomerStateLike(state);
    if (!record) {
      return [];
    }

    const polarSlugs = extractEntitlementSlugs(record);
    const mapped = polarSlugsToFeatures(polarSlugs, billingConfig.featureToPolarSlug);

    if (mapped.length > 0) {
      return mapped;
    }

    const journalPolarSlug = billingConfig.featureToPolarSlug.journal;
    if (hasEntitlementAccess(record, journalPolarSlug)) {
      return ['journal'];
    }

    if ((record.activeSubscriptions?.length ?? 0) > 0) {
      return ['journal'];
    }

    return [];
  }

  private async fetchCustomerState(userId: string): Promise<unknown | null> {
    const polarClient = createPolarClient();
    if (!polarClient) {
      return null;
    }

    try {
      return await polarClient.customers.getStateExternal({ externalId: userId });
    } catch (error) {
      this.logger.debug(
        `Polar customer state unavailable for user ${userId}: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }
}
