import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AiReviewDto, TradeAiReviewDto } from '../dtos/ai-review.dto';
import { TradeAiReviewDao } from '../daos/trade-ai-review.dao';
import {
  AI_REVIEW_PROVIDER,
  type AiReviewProvider,
  type AiReviewRange,
} from '../interfaces/ai-review-provider.interface';
import { AiReviewTokenService } from '@/modules/billing/services/ai-review-token.service';

@Injectable()
export class AiReviewService {
  constructor(
    @Inject(AI_REVIEW_PROVIDER)
    private readonly provider: AiReviewProvider,
    private readonly tradeAiReviewDao: TradeAiReviewDao,
    private readonly aiReviewTokenService: AiReviewTokenService,
  ) {}

  async generateReview(
    userId: string,
    range: AiReviewRange,
  ): Promise<AiReviewDto> {
    return this.provider.generateReview(userId, range);
  }

  async getStoredTradeReview(
    userId: string,
    tradeId: string,
  ): Promise<TradeAiReviewDto | null> {
    return this.tradeAiReviewDao.findByTradeId(tradeId, userId);
  }

  async requestTradeReview(
    userId: string,
    tradeId: string,
    email?: string | null,
  ): Promise<TradeAiReviewDto> {
    const existing = await this.tradeAiReviewDao.findByTradeId(tradeId, userId);
    if (existing) {
      return existing;
    }

    await this.aiReviewTokenService.assertCanConsume(userId, email);

    const review = await this.provider.generateTradeReview(userId, tradeId);
    if (!review) {
      throw new NotFoundException('Trade not found');
    }

    const stored = await this.tradeAiReviewDao.upsert(tradeId, userId, review);
    await this.aiReviewTokenService.consume(userId, email);
    return stored;
  }

  /** @deprecated Use getStoredTradeReview — retained for backward compatibility. */
  async generateTradeReview(
    userId: string,
    tradeId: string,
  ): Promise<TradeAiReviewDto> {
    const stored = await this.getStoredTradeReview(userId, tradeId);
    if (stored) {
      return stored;
    }

    throw new HttpException(
      'No AI review for this trade yet. Request one using POST /ai-review/trades/:tradeId.',
      HttpStatus.NOT_FOUND,
    );
  }
}
