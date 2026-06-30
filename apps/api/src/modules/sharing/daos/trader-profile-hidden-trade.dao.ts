import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';

@Injectable()
export class TraderProfileHiddenTradeDao extends KyselyDao<TraderProfileHiddenTradeDao> {
  static readonly TABLE = 'trader_profile_hidden_trade' as const;

  async findTradeIdsByUser(userId: string): Promise<string[]> {
    const rows = await this.kysely
      .selectFrom(TraderProfileHiddenTradeDao.TABLE)
      .select('tradeId')
      .where('userId', '=', userId)
      .execute();
    return rows.map((row) => row.tradeId);
  }

  async hideTrade(userId: string, tradeId: string): Promise<void> {
    await this.kysely
      .insertInto(TraderProfileHiddenTradeDao.TABLE)
      .values({ userId, tradeId })
      .onConflict((oc) => oc.columns(['userId', 'tradeId']).doNothing())
      .execute();
  }

  async unhideTrade(userId: string, tradeId: string): Promise<void> {
    await this.kysely
      .deleteFrom(TraderProfileHiddenTradeDao.TABLE)
      .where('userId', '=', userId)
      .where('tradeId', '=', tradeId)
      .execute();
  }
}
