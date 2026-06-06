import type { AiReviewDto, TradeAiReviewDto } from '../dtos/ai-review.dto';

export interface AiReviewRange {
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Abstraction over the engine that produces an AI-style performance review.
 *
 * The default implementation ({@link DeterministicAiReviewProvider}) returns
 * deterministic, derived/placeholder content. A later phase can provide an
 * alternative implementation (e.g. OpenAI-backed) bound to this same token
 * without touching the controller/service contract.
 */
export interface AiReviewProvider {
  generateReview(userId: string, range: AiReviewRange): Promise<AiReviewDto>;
  generateTradeReview(
    userId: string,
    tradeId: string,
  ): Promise<TradeAiReviewDto | null>;
}

export const AI_REVIEW_PROVIDER = Symbol('AI_REVIEW_PROVIDER');
