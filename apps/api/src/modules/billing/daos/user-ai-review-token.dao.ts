import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';

export interface UserAiReviewTokenState {
  aiReviewTokensRemaining: number | null;
  aiReviewTokensPeriodStart: Date | null;
}

@Injectable()
export class UserAiReviewTokenDao extends KyselyDao<UserAiReviewTokenDao> {
  async findState(userId: string): Promise<UserAiReviewTokenState | null> {
    const row = await this.kysely
      .selectFrom('user')
      .select(['aiReviewTokensRemaining', 'aiReviewTokensPeriodStart'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return {
      aiReviewTokensRemaining: row.aiReviewTokensRemaining,
      aiReviewTokensPeriodStart: row.aiReviewTokensPeriodStart
        ? new Date(row.aiReviewTokensPeriodStart)
        : null,
    };
  }

  async resetBalance(
    userId: string,
    remaining: number,
    periodStart: Date,
  ): Promise<void> {
    await this.kysely
      .updateTable('user')
      .set({
        aiReviewTokensRemaining: remaining,
        aiReviewTokensPeriodStart: periodStart,
      })
      .where('id', '=', userId)
      .execute();
  }

  async deductTokens(userId: string, cost: number): Promise<boolean> {
    const result = await this.kysely
      .updateTable('user')
      .set({
        aiReviewTokensRemaining: sql`${sql.ref('aiReviewTokensRemaining')} - ${cost}`,
      })
      .where('id', '=', userId)
      .where('aiReviewTokensRemaining', '>=', cost)
      .executeTakeFirst();

    return Number(result.numUpdatedRows ?? 0) > 0;
  }
}
