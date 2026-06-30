import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import {
  MAX_SHOWCASED_TRADES,
  PROFILE_SHOWCASE_TRADE_VISIBILITY,
} from '../constants/sharing.constants';

export interface ShowcasedTradeRow {
  tradeId: string;
  shareToken: string;
  symbol: string;
  direction: string;
  marketType: string;
  pnl: string | null;
  rMultiple: string | null;
  status: string;
  entryTime: Date;
  exitTime: Date | null;
}

@Injectable()
export class TraderProfileTradeDao extends KyselyDao<TraderProfileTradeDao> {
  static readonly TABLE = 'trader_profile_trade' as const;

  async findTradeIdsByUser(userId: string): Promise<string[]> {
    const rows = await this.kysely
      .selectFrom(TraderProfileTradeDao.TABLE)
      .select('tradeId')
      .where('userId', '=', userId)
      .execute();
    return rows.map((row) => row.tradeId);
  }

  async findPublicShowcaseTradeIdsByUser(userId: string): Promise<string[]> {
    const rows = await this.kysely
      .selectFrom(TraderProfileTradeDao.TABLE)
      .innerJoin('trade', 'trade.id', `${TraderProfileTradeDao.TABLE}.tradeId`)
      .select(`${TraderProfileTradeDao.TABLE}.tradeId as tradeId`)
      .where(`${TraderProfileTradeDao.TABLE}.userId`, '=', userId)
      .where('trade.visibility', '=', PROFILE_SHOWCASE_TRADE_VISIBILITY)
      .where('trade.shareToken', 'is not', null)
      .execute();
    return rows.map((row) => row.tradeId);
  }

  async removeTradeForUser(userId: string, tradeId: string): Promise<void> {
    await this.kysely
      .deleteFrom(TraderProfileTradeDao.TABLE)
      .where('userId', '=', userId)
      .where('tradeId', '=', tradeId)
      .execute();
  }

  async replaceForUser(userId: string, tradeIds: string[]): Promise<void> {
    await this.kysely.transaction().execute(async (trx) => {
      await trx
        .deleteFrom(TraderProfileTradeDao.TABLE)
        .where('userId', '=', userId)
        .execute();

      if (tradeIds.length === 0) {
        return;
      }

      await trx
        .insertInto(TraderProfileTradeDao.TABLE)
        .values(
          tradeIds.map((tradeId) => ({
            userId,
            tradeId,
          })),
        )
        .execute();
    });
  }

  async findShowcasedTradesForUser(
    userId: string,
    tradingAccountIds?: string[],
    page = 1,
    limit = MAX_SHOWCASED_TRADES,
    hiddenTradeIds: string[] = [],
  ): Promise<ShowcasedTradeRow[]> {
    let query = this.buildShowcasedTradesQuery(userId, tradingAccountIds, hiddenTradeIds);

    if (!query) {
      return [];
    }

    const offset = (page - 1) * limit;

    return query
      .orderBy('trade.entryTime', 'desc')
      .offset(offset)
      .limit(limit)
      .execute() as Promise<ShowcasedTradeRow[]>;
  }

  async countShowcasedTradesForUser(
    userId: string,
    tradingAccountIds?: string[],
    hiddenTradeIds: string[] = [],
  ): Promise<number> {
    const query = this.buildShowcasedTradesBaseQuery(userId, tradingAccountIds, hiddenTradeIds);

    if (!query) {
      return 0;
    }

    const row = await query
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async findSharedTradesForUser(
    userId: string,
    page = 1,
    limit = MAX_SHOWCASED_TRADES,
    tradingAccountIds?: string[],
    hiddenTradeIds: string[] = [],
  ): Promise<ShowcasedTradeRow[]> {
    const query = this.buildSharedTradesQuery(userId, tradingAccountIds, hiddenTradeIds);

    if (!query) {
      return [];
    }

    const offset = (page - 1) * limit;

    return query
      .orderBy('trade.entryTime', 'desc')
      .offset(offset)
      .limit(limit)
      .execute() as Promise<ShowcasedTradeRow[]>;
  }

  async countSharedTradesForUser(
    userId: string,
    tradingAccountIds?: string[],
    hiddenTradeIds: string[] = [],
  ): Promise<number> {
    const query = this.buildSharedTradesBaseQuery(userId, tradingAccountIds, hiddenTradeIds);

    if (!query) {
      return 0;
    }

    const row = await query
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  private buildShowcasedTradesQuery(
    userId: string,
    tradingAccountIds?: string[],
    hiddenTradeIds: string[] = [],
  ) {
    const query = this.buildShowcasedTradesBaseQuery(userId, tradingAccountIds, hiddenTradeIds);

    if (!query) {
      return null;
    }

    return query.select(this.sharedTradeSelect());
  }

  private buildShowcasedTradesBaseQuery(
    userId: string,
    tradingAccountIds?: string[],
    hiddenTradeIds: string[] = [],
  ) {
    if (tradingAccountIds !== undefined && tradingAccountIds.length === 0) {
      return null;
    }

    let query = this.kysely
      .selectFrom(TraderProfileTradeDao.TABLE)
      .innerJoin('trade', 'trade.id', `${TraderProfileTradeDao.TABLE}.tradeId`)
      .where(`${TraderProfileTradeDao.TABLE}.userId`, '=', userId)
      .where('trade.visibility', '=', PROFILE_SHOWCASE_TRADE_VISIBILITY)
      .where('trade.shareToken', 'is not', null);

    if (tradingAccountIds !== undefined && tradingAccountIds.length > 0) {
      query = query.where('trade.accountId', 'in', tradingAccountIds);
    }

    if (hiddenTradeIds.length > 0) {
      query = query.where('trade.id', 'not in', hiddenTradeIds);
    }

    return query;
  }

  private buildSharedTradesQuery(
    userId: string,
    tradingAccountIds?: string[],
    hiddenTradeIds: string[] = [],
  ) {
    const query = this.buildSharedTradesBaseQuery(userId, tradingAccountIds, hiddenTradeIds);

    if (!query) {
      return null;
    }

    return query.select(this.sharedTradeSelect());
  }

  private buildSharedTradesBaseQuery(
    userId: string,
    tradingAccountIds?: string[],
    hiddenTradeIds: string[] = [],
  ) {
    if (tradingAccountIds !== undefined && tradingAccountIds.length === 0) {
      return null;
    }

    let query = this.kysely
      .selectFrom('trade')
      .where('trade.userId', '=', userId)
      .where('trade.visibility', '=', PROFILE_SHOWCASE_TRADE_VISIBILITY)
      .where('trade.shareToken', 'is not', null);

    if (tradingAccountIds !== undefined && tradingAccountIds.length > 0) {
      query = query.where('trade.accountId', 'in', tradingAccountIds);
    }

    if (hiddenTradeIds.length > 0) {
      query = query.where('trade.id', 'not in', hiddenTradeIds);
    }

    return query;
  }

  private sharedTradeSelect() {
    return [
      'trade.id as tradeId',
      'trade.shareToken as shareToken',
      'trade.symbol as symbol',
      'trade.direction as direction',
      'trade.marketType as marketType',
      'trade.pnl as pnl',
      'trade.rMultiple as rMultiple',
      'trade.status as status',
      'trade.entryTime as entryTime',
      'trade.exitTime as exitTime',
    ] as const;
  }
}
