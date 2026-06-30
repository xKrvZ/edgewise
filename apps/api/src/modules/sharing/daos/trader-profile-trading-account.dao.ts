import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';

@Injectable()
export class TraderProfileTradingAccountDao extends KyselyDao<TraderProfileTradingAccountDao> {
  static readonly TABLE = 'trader_profile_trading_account' as const;

  async findTradingAccountIdsByUser(userId: string): Promise<string[]> {
    const rows = await this.kysely
      .selectFrom(TraderProfileTradingAccountDao.TABLE)
      .select('tradingAccountId')
      .where('userId', '=', userId)
      .execute();
    return rows.map((row) => row.tradingAccountId);
  }

  async replaceForUser(userId: string, tradingAccountIds: string[]): Promise<void> {
    await this.kysely.transaction().execute(async (trx) => {
      await trx
        .deleteFrom(TraderProfileTradingAccountDao.TABLE)
        .where('userId', '=', userId)
        .execute();

      if (tradingAccountIds.length === 0) {
        return;
      }

      await trx
        .insertInto(TraderProfileTradingAccountDao.TABLE)
        .values(
          tradingAccountIds.map((tradingAccountId) => ({
            userId,
            tradingAccountId,
          })),
        )
        .execute();
    });
  }
}
