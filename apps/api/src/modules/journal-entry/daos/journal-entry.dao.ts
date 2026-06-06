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
import type { DB, JournalEntry } from '@/database/types/db';

@Injectable()
export class JournalEntryDao extends KyselyDao<JournalEntryDao> {
  static readonly TABLE = 'journal_entry' as const;
  static readonly TRADE_TABLE = 'journal_entry_trade' as const;

  private applyListFilters(
    query: any,
    userId: string,
    filters: { dateFrom?: string; dateTo?: string; tradeId?: string },
  ): any {
    let q = query.where(`${JournalEntryDao.TABLE}.userId`, '=', userId);

    if (filters.tradeId) {
      q = q
        .innerJoin(
          JournalEntryDao.TRADE_TABLE,
          `${JournalEntryDao.TRADE_TABLE}.journalEntryId`,
          `${JournalEntryDao.TABLE}.id`,
        )
        .where(`${JournalEntryDao.TRADE_TABLE}.tradeId`, '=', filters.tradeId);
    }
    if (filters.dateFrom) {
      q = q.where(`${JournalEntryDao.TABLE}.date`, '>=', new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      q = q.where(`${JournalEntryDao.TABLE}.date`, '<=', new Date(filters.dateTo));
    }

    return q;
  }

  async findCursorPaged(
    userId: string,
    filters: { dateFrom?: string; dateTo?: string; tradeId?: string },
    options: { cursor?: string; limit?: number },
  ): Promise<PaginatedDto<Selectable<JournalEntry>>> {
    const limit = options.limit ?? 25;

    return this.paginateWithCursor<Selectable<JournalEntry>>(
      this.kysely
        .selectFrom(JournalEntryDao.TABLE)
        .selectAll(JournalEntryDao.TABLE),
      {
        cursor: options.cursor,
        limit,
        cursorField: `${JournalEntryDao.TABLE}.date`,
        tieBreakerField: `${JournalEntryDao.TABLE}.id`,
        filters,
        orderBy: { field: 'date', direction: 'desc' },
        applyFilters: (query) => this.applyListFilters(query, userId, filters),
      },
    );
  }

  async findAllByUser(
    userId: string,
    filters: { dateFrom?: string; dateTo?: string; tradeId?: string } = {},
  ): Promise<Selectable<JournalEntry>[]> {
    return this.applyListFilters(
      this.kysely
        .selectFrom(JournalEntryDao.TABLE)
        .selectAll(JournalEntryDao.TABLE),
      userId,
      filters,
    )
      .orderBy(`${JournalEntryDao.TABLE}.date`, 'desc')
      .orderBy(`${JournalEntryDao.TABLE}.id`, 'desc')
      .execute();
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<Selectable<JournalEntry> | null> {
    const row = await this.kysely
      .selectFrom(JournalEntryDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  async findTradeIdsByJournalEntryIds(
    journalEntryIds: string[],
  ): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    if (journalEntryIds.length === 0) {
      return map;
    }

    const rows = await this.kysely
      .selectFrom(JournalEntryDao.TRADE_TABLE)
      .select(['journalEntryId', 'tradeId'])
      .where('journalEntryId', 'in', journalEntryIds)
      .execute();

    for (const row of rows) {
      const existing = map.get(row.journalEntryId) ?? [];
      existing.push(row.tradeId);
      map.set(row.journalEntryId, existing);
    }
    return map;
  }

  async create(
    data: Insertable<JournalEntry>,
  ): Promise<Selectable<JournalEntry> | null> {
    const row = await this.kysely
      .insertInto(JournalEntryDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async createWithTrades(
    data: Insertable<JournalEntry>,
    tradeIds?: string[],
  ): Promise<Selectable<JournalEntry> | null> {
    return this.kysely.transaction().execute(async (trx) => {
      const row = await trx
        .insertInto(JournalEntryDao.TABLE)
        .values(data)
        .returningAll()
        .executeTakeFirst();
      if (!row) {
        return null;
      }
      if (tradeIds !== undefined) {
        await this.syncTrades(trx, row.id, tradeIds);
      }
      return row;
    });
  }

  async updateForUser(
    id: string,
    userId: string,
    data: Updateable<JournalEntry>,
  ): Promise<Selectable<JournalEntry> | null> {
    const row = await this.kysely
      .updateTable(JournalEntryDao.TABLE)
      .set({ ...data, updatedAt: sql`now()` })
      .where('id', '=', id)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async updateForUserWithTrades(
    id: string,
    userId: string,
    data: Updateable<JournalEntry>,
    tradeIds?: string[],
  ): Promise<Selectable<JournalEntry> | null> {
    return this.kysely.transaction().execute(async (trx) => {
      const row = await trx
        .updateTable(JournalEntryDao.TABLE)
        .set({ ...data, updatedAt: sql`now()` })
        .where('id', '=', id)
        .where('userId', '=', userId)
        .returningAll()
        .executeTakeFirst();
      if (!row) {
        return null;
      }
      if (tradeIds !== undefined) {
        await this.syncTrades(trx, row.id, tradeIds);
      }
      return row;
    });
  }

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(JournalEntryDao.TABLE)
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }

  private async syncTrades(
    trx: Transaction<DB>,
    journalEntryId: string,
    tradeIds: string[],
  ): Promise<void> {
    await trx
      .deleteFrom(JournalEntryDao.TRADE_TABLE)
      .where('journalEntryId', '=', journalEntryId)
      .execute();
    const unique = [...new Set(tradeIds)];
    if (unique.length > 0) {
      await trx
        .insertInto(JournalEntryDao.TRADE_TABLE)
        .values(unique.map((tradeId) => ({ journalEntryId, tradeId })))
        .execute();
    }
  }
}
