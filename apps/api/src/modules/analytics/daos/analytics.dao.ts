import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { toNumber } from '@/database/utils/numeric.util';
import type {
  AnalyticsMistakeRow,
  AnalyticsTrade,
} from '../analytics.util';

export interface AnalyticsTradeFilters {
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  marketType?: string;
  direction?: string;
}

/**
 * Read-only data access for analytics. Returns rows; never throws and contains
 * no business logic — the derivations live in the service/util layer. Only
 * closed trades are returned, since all reporting is defined over closed trades.
 */
@Injectable()
export class AnalyticsDao extends KyselyDao<AnalyticsDao> {
  static readonly TABLE = 'trade' as const;

  private applyFilters(
    query: any,
    userId: string,
    filters: AnalyticsTradeFilters,
  ): any {
    let q = query
      .where('trade.userId', '=', userId)
      .where('trade.status', '=', 'closed');

    if (filters.accountId) {
      q = q.where('trade.accountId', '=', filters.accountId);
    }
    if (filters.marketType) {
      q = q.where('trade.marketType', '=', filters.marketType);
    }
    if (filters.direction) {
      q = q.where('trade.direction', '=', filters.direction);
    }
    if (filters.dateFrom) {
      q = q.where('trade.entryTime', '>=', new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      q = q.where('trade.entryTime', '<=', new Date(filters.dateTo));
    }

    return q;
  }

  async findClosedTrades(
    userId: string,
    filters: AnalyticsTradeFilters = {},
  ): Promise<AnalyticsTrade[]> {
    const base = this.kysely
      .selectFrom('trade')
      .leftJoin('playbook', 'playbook.id', 'trade.setupId')
      .leftJoin('trading_session', 'trading_session.id', 'trade.sessionId')
      .leftJoin('trading_account', 'trading_account.id', 'trade.accountId')
      .select([
        'trade.id as id',
        'trade.symbol as symbol',
        'trade.direction as direction',
        'trade.marketType as marketType',
        'trade.accountId as accountId',
        'trading_account.name as accountName',
        'trade.setupId as setupId',
        'playbook.name as setupName',
        'trade.sessionId as sessionId',
        'trading_session.name as sessionName',
        'trade.entryTime as entryTime',
        'trade.exitTime as exitTime',
        'trade.pnl as pnl',
        'trade.fees as fees',
        'trade.rMultiple as rMultiple',
        'trade.stopLoss as stopLoss',
        'trade.executionRating as executionRating',
      ]);

    const rows = await this.applyFilters(base, userId, filters)
      .orderBy('trade.entryTime', 'asc')
      .execute();

    return rows.map((row: any) => ({
      id: row.id,
      symbol: row.symbol,
      direction: row.direction,
      marketType: row.marketType,
      accountId: row.accountId,
      accountName: row.accountName ?? null,
      setupId: row.setupId ?? null,
      setupName: row.setupName ?? null,
      sessionId: row.sessionId ?? null,
      sessionName: row.sessionName ?? null,
      entryTime: row.entryTime,
      exitTime: row.exitTime ?? null,
      pnl: toNumber(row.pnl) ?? 0,
      fees: toNumber(row.fees) ?? 0,
      rMultiple: toNumber(row.rMultiple),
      stopLoss: toNumber(row.stopLoss),
      executionRating: row.executionRating ?? null,
    }));
  }

  /**
   * Sums the starting balance of the user's trading accounts, optionally scoped
   * to a single account. Used as the baseline for the account-balance curve.
   * Returns 0 when no accounts match.
   */
  /**
   * Breakeven band for win/loss classification. Uses the scoped account when
   * filtered; otherwise returns 0 (strict breakeven).
   */
  async resolveBreakevenRange(
    userId: string,
    accountId?: string,
  ): Promise<number> {
    if (!accountId) {
      return 0;
    }
    const row = await this.kysely
      .selectFrom('trading_account')
      .select('breakevenRange')
      .where('userId', '=', userId)
      .where('id', '=', accountId)
      .executeTakeFirst();
    return toNumber(row?.breakevenRange) ?? 0;
  }

  async sumStartingBalance(
    userId: string,
    accountId?: string,
  ): Promise<number> {
    let q = this.kysely
      .selectFrom('trading_account')
      .select((eb) => eb.fn.sum('startingBalance').as('total'))
      .where('userId', '=', userId);

    if (accountId) {
      q = q.where('id', '=', accountId);
    }

    const row = await q.executeTakeFirst();
    return toNumber((row as { total: string | number | null })?.total) ?? 0;
  }

  /**
   * Returns one row per (trade, mistake) link for the user's closed trades that
   * match the filters, carrying the mistake label and the trade's P&L / R so the
   * service can aggregate per-mistake performance.
   */
  async findClosedTradeMistakes(
    userId: string,
    filters: AnalyticsTradeFilters = {},
  ): Promise<AnalyticsMistakeRow[]> {
    const base = this.kysely
      .selectFrom('trade_mistake')
      .innerJoin('trade', 'trade.id', 'trade_mistake.tradeId')
      .innerJoin('mistake', 'mistake.id', 'trade_mistake.mistakeId')
      .select([
        'mistake.id as mistakeId',
        'mistake.name as mistakeName',
        'trade.pnl as pnl',
        'trade.rMultiple as rMultiple',
      ]);

    const rows = await this.applyFilters(base, userId, filters).execute();

    return rows.map((row: any) => ({
      mistakeId: row.mistakeId,
      mistakeName: row.mistakeName,
      pnl: toNumber(row.pnl) ?? 0,
      rMultiple: toNumber(row.rMultiple),
    }));
  }
}
