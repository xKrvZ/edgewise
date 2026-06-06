import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AiReviewDto, TradeAiReviewDto } from '../dtos/ai-review.dto';
import {
  AI_REVIEW_PROVIDER,
  type AiReviewProvider,
  type AiReviewRange,
} from '../interfaces/ai-review-provider.interface';

@Injectable()
export class AiReviewService {
  constructor(
    @Inject(AI_REVIEW_PROVIDER)
    private readonly provider: AiReviewProvider,
  ) {}

  async generateReview(
    userId: string,
    range: AiReviewRange,
  ): Promise<AiReviewDto> {
    return this.provider.generateReview(userId, range);
  }

  async generateTradeReview(
    userId: string,
    tradeId: string,
  ): Promise<TradeAiReviewDto> {
    const review = await this.provider.generateTradeReview(userId, tradeId);
    if (!review) {
      throw new NotFoundException('Trade not found');
    }
    return review;
  }
}
