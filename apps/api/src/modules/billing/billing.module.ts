import { Module, forwardRef } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AccountModule } from '@/modules/account/account.module';
import { BillingController } from './controllers/billing.controller';
import { SubscriptionDao } from './daos/subscription.dao';
import { SubscriptionGuard } from './guards/subscription.guard';
import { MockFeatureProvider } from './providers/mock-feature.provider';
import { PolarFeatureProvider } from './providers/polar-feature.provider';
import { AccountLimitService } from './services/account-limit.service';
import { AiReviewTokenService } from './services/ai-review-token.service';
import { BillingService } from './services/billing.service';
import { FeatureAccessService } from './services/feature-access.service';
import { UserAccountLimitDao } from './daos/user-account-limit.dao';
import { UserAiReviewTokenDao } from './daos/user-ai-review-token.dao';

@Module({
  imports: [forwardRef(() => AccountModule)],
  controllers: [BillingController],
  providers: [
    SubscriptionDao,
    MockFeatureProvider,
    PolarFeatureProvider,
    FeatureAccessService,
    AccountLimitService,
    AiReviewTokenService,
    BillingService,
    SubscriptionGuard,
    UserAccountLimitDao,
    UserAiReviewTokenDao,
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
  ],
  exports: [BillingService, FeatureAccessService, AccountLimitService, AiReviewTokenService, SubscriptionDao, UserAccountLimitDao, UserAiReviewTokenDao],
})
export class BillingModule {}
