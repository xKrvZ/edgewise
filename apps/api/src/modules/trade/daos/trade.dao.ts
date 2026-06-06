import { Injectable } from '@nestjs/common';
import {
  sql,
  type Insertable,
  type Selectable,
  type Transaction,
  type Updateable,
} from 'kysely';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { DB, Trade } from '@/database/types/db';
import type { TradeFilters } from '../dtos/trade-query.dto';

@Injectable()
export class TradeDao extends KyselyDao<TradeDao> {
  static readonly TABLE = 'trade' as const;

  /**
   * Applies user scoping + optional filters to a `trade` select query.
   */
  private applyFilters(query: any, userId: string, filters: TradeFilters): any {
    let q = query.where('trade.userId', '=', userId);

    if (filters.symbol) {
      q = q.where('trade.symbol', '=', filters.symbol);
    }
    if (filters.accountId) {
      q = q.where('trade.accountId', '=', filters.accountId);
    }
    if (filters.direction) {
      q = q.where('trade.direction', '=', filters.direction);
    }
    if (filters.marketType) {
      q = q.where('trade.marketType', '=', filters.marketType);
    }
    if (filters.setupId) {
      q = q.where('trade.setupId', '=', filters.setupId);
    }
    if (filters.playbookId) {
      q = q.where('trade.playbookId', '=', filters.playbookId);
    }
    if (filters.dateFrom) {
      q = q.where('trade.entryTime', '>=', new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      q = q.where('trade.entryTime', '<=', new Date(filters.dateTo));
    }
    if (filters.tagId) {
      q = q.where(({ exists, selectFrom }: any) =>
        exists(
          selectFrom('trade_tag')
            .select('trade_tag.tradeId')
            .whereRef('trade_tag.tradeId', '=', 'trade.id')
            .where('trade_tag.tagId', '=', filters.tagId),
        ),
      );
    }

    return q;
  }

  async findCursorPaged(
    userId: string,
    filters: TradeFilters,
    options: { cursor?: string; limit?: number },
  ): Promise<PaginatedDto<Selectable<Trade>>> {
    const limit = options.limit ?? 25;

    return this.paginateWithCursor<Selectable<Trade>>(
      this.kysely.selectFrom(TradeDao.TABLE).selectAll('trade'),
      {
        cursor: options.cursor,
        limit,
        cursorField: 'trade.entryTime',
        tieBreakerField: 'trade.id',
        filters,
        orderBy: { field: 'trade.entryTime', direction: 'desc' },
        applyFilters: (query) => this.applyFilters(query, userId, filters),
      },
    );
  }

  async findById(id: string): Promise<Selectable<Trade> | null> {
    const row = await this.kysely
      .selectFrom(TradeDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ?? null;
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<Selectable<Trade> | null> {
    const row = await this.kysely
      .selectFrom(TradeDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  async findPublicByShareToken(shareToken: string): Promise<{
    trade: Selectable<Trade>;
    setupName: string | null;
    sessionName: string | null;
  } | null> {
    const row = await this.kysely
      .selectFrom(TradeDao.TABLE)
      .leftJoin('playbook', 'playbook.id', 'trade.setupId')
      .leftJoin('trading_session', 'trading_session.id', 'trade.sessionId')
      .selectAll('trade')
      .select([
        'playbook.name as setupName',
        'trading_session.name as sessionName',
      ])
      .where('trade.shareToken', '=', shareToken)
      .where('trade.visibility', 'in', ['unlisted', 'public'])
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    const { setupName, sessionName, ...trade } = row;
    return {
      trade: trade as Selectable<Trade>,
      setupName: setupName ?? null,
      sessionName: sessionName ?? null,
    };
  }

  async updateSharingForUser(
    id: string,
    userId: string,
    data: { visibility: string; shareToken: string | null },
  ): Promise<Selectable<Trade> | null> {
    const row = await this.kysely
      .updateTable(TradeDao.TABLE)
      .set({ ...data, updatedAt: sql`now()` })
      .where('id', '=', id)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async getTagNames(tradeId: string): Promise<string[]> {
    const rows = await this.kysely
      .selectFrom('trade_tag')
      .innerJoin('tag', 'tag.id', 'trade_tag.tagId')
      .select('tag.name as name')
      .where('trade_tag.tradeId', '=', tradeId)
      .orderBy('tag.name', 'asc')
      .execute();
    return rows.map((r) => r.name);
  }

  async countOwnedByIds(userId: string, ids: string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }
    const row = await this.kysely
      .selectFrom(TradeDao.TABLE)
      .select((eb) => eb.fn.countAll().as('count'))
      .where('id', 'in', ids)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return Number(row?.count ?? 0);
  }

  async findSummariesByIdsForUser(
    ids: string[],
    userId: string,
  ): Promise<Array<{ id: string; symbol: string; entryTime: Date }>> {
    if (ids.length === 0) {
      return [];
    }
    return this.kysely
      .selectFrom(TradeDao.TABLE)
      .select(['id', 'symbol', 'entryTime'])
      .where('id', 'in', ids)
      .where('userId', '=', userId)
      .orderBy('entryTime', 'desc')
      .execute();
  }

  /**
   * Loads a trade plus the labels needed to build a single-trade AI review.
   */
  async findReviewContext(
    id: string,
    userId: string,
  ): Promise<{
    trade: Selectable<Trade>;
    setupName: string | null;
    sessionName: string | null;
    mistakeNames: string[];
  } | null> {
    const row = await this.kysely
      .selectFrom(TradeDao.TABLE)
      .leftJoin('playbook', 'playbook.id', 'trade.setupId')
      .leftJoin('trading_session', 'trading_session.id', 'trade.sessionId')
      .selectAll('trade')
      .select([
        'playbook.name as setupName',
        'trading_session.name as sessionName',
      ])
      .where('trade.id', '=', id)
      .where('trade.userId', '=', userId)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    const mistakeRows = await this.kysely
      .selectFrom('trade_mistake')
      .innerJoin('mistake', 'mistake.id', 'trade_mistake.mistakeId')
      .select('mistake.name as name')
      .where('trade_mistake.tradeId', '=', id)
      .execute();

    const { setupName, sessionName, ...trade } = row;

    return {
      trade: trade as Selectable<Trade>,
      setupName: setupName ?? null,
      sessionName: sessionName ?? null,
      mistakeNames: mistakeRows.map((m) => m.name),
    };
  }

  async create(data: Insertable<Trade>): Promise<Selectable<Trade> | null> {
    const row = await this.kysely
      .insertInto(TradeDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  /**
   * Inserts a trade and synchronizes its tag/mistake join rows in one
   * transaction. When `tagIds`/`mistakeIds` are undefined the corresponding
   * joins are left untouched (none exist on a fresh trade).
   */
  async createWithRelations(
    data: Insertable<Trade>,
    tagIds?: string[],
    mistakeIds?: string[],
  ): Promise<Selectable<Trade> | null> {
    return this.kysely.transaction().execute(async (trx) => {
      const row = await trx
        .insertInto(TradeDao.TABLE)
        .values(data)
        .returningAll()
        .executeTakeFirst();
      if (!row) {
        return null;
      }
      if (tagIds !== undefined) {
        await this.syncTags(trx, row.id, tagIds);
      }
      if (mistakeIds !== undefined) {
        await this.syncMistakes(trx, row.id, mistakeIds);
      }
      return row;
    });
  }

  async updateForUser(
    id: string,
    userId: string,
    data: Updateable<Trade>,
  ): Promise<Selectable<Trade> | null> {
    const row = await this.kysely
      .updateTable(TradeDao.TABLE)
      .set({ ...data, updatedAt: sql`now()` })
      .where('id', '=', id)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  /**
   * Updates a trade (scoped to the user) and, when provided, replaces its
   * tag/mistake join rows. Passing `undefined` leaves existing joins intact.
   */
  async updateForUserWithRelations(
    id: string,
    userId: string,
    data: Updateable<Trade>,
    tagIds?: string[],
    mistakeIds?: string[],
  ): Promise<Selectable<Trade> | null> {
    return this.kysely.transaction().execute(async (trx) => {
      const row = await trx
        .updateTable(TradeDao.TABLE)
        .set({ ...data, updatedAt: sql`now()` })
        .where('id', '=', id)
        .where('userId', '=', userId)
        .returningAll()
        .executeTakeFirst();
      if (!row) {
        return null;
      }
      if (tagIds !== undefined) {
        await this.syncTags(trx, row.id, tagIds);
      }
      if (mistakeIds !== undefined) {
        await this.syncMistakes(trx, row.id, mistakeIds);
      }
      return row;
    });
  }

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(TradeDao.TABLE)
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }

  // ==================== Tag / mistake joins ====================

  private async syncTags(
    trx: Transaction<DB>,
    tradeId: string,
    tagIds: string[],
  ): Promise<void> {
    await trx.deleteFrom('trade_tag').where('tradeId', '=', tradeId).execute();
    const unique = [...new Set(tagIds)];
    if (unique.length > 0) {
      await trx
        .insertInto('trade_tag')
        .values(unique.map((tagId) => ({ tradeId, tagId })))
        .execute();
    }
  }

  private async syncMistakes(
    trx: Transaction<DB>,
    tradeId: string,
    mistakeIds: string[],
  ): Promise<void> {
    await trx
      .deleteFrom('trade_mistake')
      .where('tradeId', '=', tradeId)
      .execute();
    const unique = [...new Set(mistakeIds)];
    if (unique.length > 0) {
      await trx
        .insertInto('trade_mistake')
        .values(unique.map((mistakeId) => ({ tradeId, mistakeId })))
        .execute();
    }
  }

  async getTagIds(tradeId: string): Promise<string[]> {
    const rows = await this.kysely
      .selectFrom('trade_tag')
      .select('tagId')
      .where('tradeId', '=', tradeId)
      .execute();
    return rows.map((r) => r.tagId);
  }

  async getMistakeIds(tradeId: string): Promise<string[]> {
    const rows = await this.kysely
      .selectFrom('trade_mistake')
      .select('mistakeId')
      .where('tradeId', '=', tradeId)
      .execute();
    return rows.map((r) => r.mistakeId);
  }

  /**
   * Batch-loads tag/mistake ids for a set of trades, returning two maps keyed
   * by tradeId. Trades with no links are simply absent from the maps.
   */
  async getRelationIdsForTrades(tradeIds: string[]): Promise<{
    tags: Map<string, string[]>;
    mistakes: Map<string, string[]>;
  }> {
    const tags = new Map<string, string[]>();
    const mistakes = new Map<string, string[]>();
    if (tradeIds.length === 0) {
      return { tags, mistakes };
    }

    const [tagRows, mistakeRows] = await Promise.all([
      this.kysely
        .selectFrom('trade_tag')
        .select(['tradeId', 'tagId'])
        .where('tradeId', 'in', tradeIds)
        .execute(),
      this.kysely
        .selectFrom('trade_mistake')
        .select(['tradeId', 'mistakeId'])
        .where('tradeId', 'in', tradeIds)
        .execute(),
    ]);

    for (const r of tagRows) {
      const list = tags.get(r.tradeId) ?? [];
      list.push(r.tagId);
      tags.set(r.tradeId, list);
    }
    for (const r of mistakeRows) {
      const list = mistakes.get(r.tradeId) ?? [];
      list.push(r.mistakeId);
      mistakes.set(r.tradeId, list);
    }

    return { tags, mistakes };
  }

  /**
   * Returns the subset of `ids` that are tags owned by `userId`. Used by the
   * service to validate ownership before linking.
   */
  async filterOwnedTagIds(userId: string, ids: string[]): Promise<string[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.kysely
      .selectFrom('tag')
      .select('id')
      .where('userId', '=', userId)
      .where('id', 'in', ids)
      .execute();
    return rows.map((r) => r.id);
  }

  async filterOwnedMistakeIds(
    userId: string,
    ids: string[],
  ): Promise<string[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.kysely
      .selectFrom('mistake')
      .select('id')
      .where('userId', '=', userId)
      .where('id', 'in', ids)
      .execute();
    return rows.map((r) => r.id);
  }
}
