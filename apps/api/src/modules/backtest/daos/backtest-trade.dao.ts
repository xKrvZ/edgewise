import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { BacktestTrade } from '@/database/types/db';

@Injectable()
export class BacktestTradeDao extends KyselyDao<BacktestTradeDao> {
  static readonly TABLE = 'backtest_trade' as const;

  async findStatsByUser(
    userId: string,
  ): Promise<
    { backtestId: string; tradeCount: number; netPnl: string | null }[]
  > {
    const rows = await this.kysely
      .selectFrom(BacktestTradeDao.TABLE)
      .select([
        'backtestId',
        this.kysely.fn.count('id').as('tradeCount'),
        this.kysely.fn.sum('pnl').as('netPnl'),
      ])
      .where('userId', '=', userId)
      .groupBy('backtestId')
      .execute();

    return rows.map((row) => ({
      backtestId: row.backtestId,
      tradeCount: Number(row.tradeCount),
      netPnl: row.netPnl === null || row.netPnl === undefined ? null : String(row.netPnl),
    }));
  }

  async findByBacktest(
    backtestId: string,
  ): Promise<Selectable<BacktestTrade>[]> {
    return this.kysely
      .selectFrom(BacktestTradeDao.TABLE)
      .selectAll()
      .where('backtestId', '=', backtestId)
      .orderBy('entryTime', 'asc')
      .execute();
  }

  async findById(id: string): Promise<Selectable<BacktestTrade> | null> {
    const row = await this.kysely
      .selectFrom(BacktestTradeDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ?? null;
  }

  async create(
    data: Insertable<BacktestTrade>,
  ): Promise<Selectable<BacktestTrade> | null> {
    const row = await this.kysely
      .insertInto(BacktestTradeDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async deleteForBacktest(id: string, backtestId: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(BacktestTradeDao.TABLE)
      .where('id', '=', id)
      .where('backtestId', '=', backtestId)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
