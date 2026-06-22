import { ForbiddenException, Injectable } from '@nestjs/common';
import { hasRole, ROLES } from '@/auth/constants/roles.constants';
import billingConfig, { type BillingPlanId } from '@/config/billing.config';
import { PLATFORM_FEATURES, type PlatformFeature } from '../constants/features.constants';
import { SubscriptionDao } from '../daos/subscription.dao';
import { UserAccountLimitDao } from '../daos/user-account-limit.dao';
import { FeatureAccessService } from './feature-access.service';

export interface AccountQuota {
  planId: BillingPlanId | 'none';
  maxAccounts: number;
  planMaxAccounts: number;
  override: number | null;
  accountCount: number;
  canCreate: boolean;
}

const PREMIUM_FEATURES: PlatformFeature[] = ['analytics', 'ai_review', 'replay', 'backtest'];

@Injectable()
export class AccountLimitService {
  constructor(
    private readonly featureAccess: FeatureAccessService,
    private readonly subscriptionDao: SubscriptionDao,
    private readonly userAccountLimitDao: UserAccountLimitDao,
  ) {}

  async getQuota(
    userId: string,
    accountCount: number,
    email?: string | null,
  ): Promise<AccountQuota> {
    const planId = await this.resolvePlanId(userId, email);
    const planMaxAccounts = this.maxAccountsForPlan(planId);
    const override = await this.userAccountLimitDao.findOverride(userId);
    const maxAccounts = override ?? planMaxAccounts;
    return {
      planId,
      maxAccounts,
      planMaxAccounts,
      override,
      accountCount,
      canCreate: planId !== 'none' && accountCount < maxAccounts,
    };
  }

  async canCreateCommunity(
    userId: string,
    email?: string | null,
    role?: string | string[] | null,
  ): Promise<boolean> {
    if (role && hasRole(role, ROLES.ADMINISTRATOR)) {
      return true;
    }

    const planId = await this.resolvePlanId(userId, email);
    return planId === 'elite';
  }

  async assertCanCreateCommunity(
    userId: string,
    email?: string | null,
    role?: string | string[] | null,
  ): Promise<void> {
    const allowed = await this.canCreateCommunity(userId, email, role);
    if (allowed) {
      return;
    }

    throw new ForbiddenException(
      'Creating communities requires the Elite plan. Upgrade to Elite to start your own community.',
    );
  }

  async assertCanCreate(
    userId: string,
    accountCount: number,
    email?: string | null,
  ): Promise<void> {
    const quota = await this.getQuota(userId, accountCount, email);
    if (quota.canCreate) {
      return;
    }

    if (quota.planId === 'none') {
      throw new ForbiddenException('An active subscription is required to create trading accounts');
    }

    throw new ForbiddenException(
      `Account limit reached (${quota.accountCount}/${quota.maxAccounts}). Upgrade your plan to add more trading accounts.`,
    );
  }

  private maxAccountsForPlan(planId: BillingPlanId | 'none'): number {
    if (planId === 'none') {
      return 0;
    }
    return billingConfig.planAccountLimits[planId];
  }

  private async resolvePlanId(
    userId: string,
    email?: string | null,
  ): Promise<BillingPlanId | 'none'> {
    if (email === billingConfig.demoUserEmail) {
      return billingConfig.demoPlan;
    }

    const hasAccess = await this.featureAccess.hasPlatformAccess(userId, email);
    if (!hasAccess) {
      return 'none';
    }

    const stored = await this.subscriptionDao.findByUserId(userId);
    if (stored?.productId) {
      const mapped = billingConfig.productIdToPlan[stored.productId];
      if (mapped) {
        return mapped;
      }
    }

    const features = await this.featureAccess.listFeatures(userId, email);
    const hasAllPremium = PREMIUM_FEATURES.every((feature) => features.includes(feature));
    const hasAllFeatures = PLATFORM_FEATURES.every((feature) => features.includes(feature));

    if (hasAllFeatures || hasAllPremium) {
      return 'pro';
    }

    if (this.featureAccess.isMockMode()) {
      return billingConfig.mockDefaultPlan;
    }

    return 'starter';
  }
}
