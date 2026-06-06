import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BillingController } from './controllers/billing.controller';
import { SubscriptionDao } from './daos/subscription.dao';
import { SubscriptionGuard } from './guards/subscription.guard';
import { MockFeatureProvider } from './providers/mock-feature.provider';
import { PolarFeatureProvider } from './providers/polar-feature.provider';
import { BillingService } from './services/billing.service';
import { FeatureAccessService } from './services/feature-access.service';

@Module({
  controllers: [BillingController],
  providers: [
    SubscriptionDao,
    MockFeatureProvider,
    PolarFeatureProvider,
    FeatureAccessService,
    BillingService,
    SubscriptionGuard,
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
  ],
  exports: [BillingService, FeatureAccessService, SubscriptionDao],
})
export class BillingModule {}
