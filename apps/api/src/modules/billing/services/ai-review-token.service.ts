import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import billingConfig, { type BillingPlanId } from '@/config/billing.config';
import { UserAiReviewTokenDao } from '../daos/user-ai-review-token.dao';
import { AccountLimitService } from './account-limit.service';

export interface AiReviewTokenBalance {
  planId: BillingPlanId | 'none';
  tokensRemaining: number | null;
  tokensLimit: number | null;
  unlimited: boolean;
  canRequest: boolean;
  periodStart: string | null;
}

@Injectable()
export class AiReviewTokenService {
  constructor(
    private readonly accountLimitService: AccountLimitService,
    private readonly userAiReviewTokenDao: UserAiReviewTokenDao,
  ) {}

  async getBalance(userId: string, email?: string | null): Promise<AiReviewTokenBalance> {
    const quota = await this.accountLimitService.getQuota(userId, 0, email);
    const planId = quota.planId;
    const tokensLimit = this.tokensLimitForPlan(planId);
    const unlimited = tokensLimit === null && planId !== 'none';

    if (planId === 'none') {
      return {
        planId,
        tokensRemaining: 0,
        tokensLimit: 0,
        unlimited: false,
        canRequest: false,
        periodStart: null,
      };
    }

    if (unlimited) {
      return {
        planId,
        tokensRemaining: null,
        tokensLimit: null,
        unlimited: true,
        canRequest: true,
        periodStart: null,
      };
    }

    const state = await this.ensureCurrentPeriod(userId, tokensLimit as number);
    const remaining = state.aiReviewTokensRemaining ?? tokensLimit as number;

    return {
      planId,
      tokensRemaining: remaining,
      tokensLimit: tokensLimit as number,
      unlimited: false,
      canRequest: remaining >= billingConfig.aiReviewTokenCost,
      periodStart: state.aiReviewTokensPeriodStart?.toISOString() ?? null,
    };
  }

  async assertCanConsume(
    userId: string,
    email?: string | null,
    cost = billingConfig.aiReviewTokenCost,
  ): Promise<AiReviewTokenBalance> {
    const balance = await this.getBalance(userId, email);

    if (balance.unlimited) {
      return balance;
    }

    if (!balance.canRequest || (balance.tokensRemaining ?? 0) < cost) {
      throw new HttpException(
        `No AI review tokens remaining (${balance.tokensRemaining ?? 0}/${balance.tokensLimit ?? 0} this month). Upgrade your plan for more reviews.`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return balance;
  }

  async consume(
    userId: string,
    email?: string | null,
    cost = billingConfig.aiReviewTokenCost,
  ): Promise<AiReviewTokenBalance> {
    const balance = await this.assertCanConsume(userId, email, cost);

    if (balance.unlimited) {
      return balance;
    }

    const deducted = await this.userAiReviewTokenDao.deductTokens(userId, cost);
    if (!deducted) {
      throw new HttpException(
        'No AI review tokens remaining. Upgrade your plan for more reviews.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return this.getBalance(userId, email);
  }

  private tokensLimitForPlan(planId: BillingPlanId | 'none'): number | null {
    if (planId === 'none') {
      return 0;
    }
    return billingConfig.planAiReviewTokenLimits[planId];
  }

  private async ensureCurrentPeriod(userId: string, tokensLimit: number) {
    const state = (await this.userAiReviewTokenDao.findState(userId)) ?? {
      aiReviewTokensRemaining: null,
      aiReviewTokensPeriodStart: null,
    };

    if (!this.needsMonthlyReset(state.aiReviewTokensPeriodStart)) {
      if (state.aiReviewTokensRemaining === null) {
        const periodStart = this.currentPeriodStart();
        await this.userAiReviewTokenDao.resetBalance(userId, tokensLimit, periodStart);
        return {
          aiReviewTokensRemaining: tokensLimit,
          aiReviewTokensPeriodStart: periodStart,
        };
      }
      return state;
    }

    const periodStart = this.currentPeriodStart();
    await this.userAiReviewTokenDao.resetBalance(userId, tokensLimit, periodStart);
    return {
      aiReviewTokensRemaining: tokensLimit,
      aiReviewTokensPeriodStart: periodStart,
    };
  }

  private needsMonthlyReset(periodStart: Date | null): boolean {
    if (!periodStart) {
      return true;
    }

    const now = new Date();
    return (
      periodStart.getUTCFullYear() !== now.getUTCFullYear() ||
      periodStart.getUTCMonth() !== now.getUTCMonth()
    );
  }

  private currentPeriodStart(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
}
