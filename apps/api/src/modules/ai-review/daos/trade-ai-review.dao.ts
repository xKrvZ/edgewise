import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { Json } from '@/database/types/db';
import type { TradeAiReviewDto } from '../dtos/ai-review.dto';

function jsonbArray(value: string[]) {
  return sql<Json>`${JSON.stringify(value)}::jsonb`;
}

@Injectable()
export class TradeAiReviewDao extends KyselyDao<TradeAiReviewDao> {
  async findByTradeId(tradeId: string, userId: string): Promise<TradeAiReviewDto | null> {
    const row = await this.kysely
      .selectFrom('trade_ai_review')
      .select(['generatedAt', 'summary', 'insights', 'mistakesFlagged', 'suggestions'])
      .where('tradeId', '=', tradeId)
      .where('userId', '=', userId)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return {
      generatedAt: row.generatedAt.toISOString(),
      summary: row.summary,
      insights: row.insights as string[],
      mistakesFlagged: row.mistakesFlagged as string[],
      suggestions: row.suggestions as string[],
    };
  }

  async upsert(
    tradeId: string,
    userId: string,
    review: TradeAiReviewDto,
  ): Promise<TradeAiReviewDto> {
    const generatedAt = new Date(review.generatedAt);

    const insights = jsonbArray(review.insights);
    const mistakesFlagged = jsonbArray(review.mistakesFlagged);
    const suggestions = jsonbArray(review.suggestions);

    await this.kysely
      .insertInto('trade_ai_review')
      .values({
        tradeId,
        userId,
        generatedAt,
        summary: review.summary,
        insights,
        mistakesFlagged,
        suggestions,
      })
      .onConflict((oc) =>
        oc.column('tradeId').doUpdateSet({
          generatedAt,
          summary: review.summary,
          insights,
          mistakesFlagged,
          suggestions,
        }),
      )
      .execute();

    return review;
  }
}
