import { Module } from '@nestjs/common';
import { BillingModule } from '@/modules/billing/billing.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { TradeModule } from '@/modules/trade/trade.module';
import { AiReviewController } from './controllers/ai-review.controller';
import { TradeAiReviewDao } from './daos/trade-ai-review.dao';
import { AiReviewService } from './services/ai-review.service';
import { DeterministicAiReviewProvider } from './providers/deterministic-ai-review.provider';
import { AI_REVIEW_PROVIDER } from './interfaces/ai-review-provider.interface';

@Module({
  imports: [AnalyticsModule, TradeModule, BillingModule],
  controllers: [AiReviewController],
  providers: [
    AiReviewService,
    TradeAiReviewDao,
    DeterministicAiReviewProvider,
    {
      provide: AI_REVIEW_PROVIDER,
      useExisting: DeterministicAiReviewProvider,
    },
  ],
  exports: [AiReviewService],
})
export class AiReviewModule {}
