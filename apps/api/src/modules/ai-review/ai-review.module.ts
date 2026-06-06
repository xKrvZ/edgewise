import { Module } from '@nestjs/common';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { TradeModule } from '@/modules/trade/trade.module';
import { AiReviewController } from './controllers/ai-review.controller';
import { AiReviewService } from './services/ai-review.service';
import { DeterministicAiReviewProvider } from './providers/deterministic-ai-review.provider';
import { AI_REVIEW_PROVIDER } from './interfaces/ai-review-provider.interface';

@Module({
  imports: [AnalyticsModule, TradeModule],
  controllers: [AiReviewController],
  providers: [
    AiReviewService,
    DeterministicAiReviewProvider,
    {
      provide: AI_REVIEW_PROVIDER,
      useExisting: DeterministicAiReviewProvider,
    },
  ],
  exports: [AiReviewService],
})
export class AiReviewModule {}
