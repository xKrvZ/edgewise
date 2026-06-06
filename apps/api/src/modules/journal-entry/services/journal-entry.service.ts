import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { TradeDao } from '@/modules/trade/daos/trade.dao';
import { JournalEntryDao } from '../daos/journal-entry.dao';
import {
  CreateJournalEntryDto,
  JournalEntryDto,
  JournalEntryQueryDto,
  JournalEntryTradeSummaryDto,
  UpdateJournalEntryDto,
  toJournalEntryDto,
} from '../dtos/journal-entry.dto';
import { MAX_JOURNAL_ENTRY_TRADES } from '../constants/journal-entry.constants';

@Injectable()
export class JournalEntryService {
  constructor(
    private readonly journalEntryDao: JournalEntryDao,
    private readonly tradeDao: TradeDao,
  ) {}

  async list(
    userId: string,
    query: JournalEntryQueryDto,
  ): Promise<PaginatedDto<JournalEntryDto>> {
    const page = await this.journalEntryDao.findCursorPaged(
      userId,
      {
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        tradeId: query.tradeId,
      },
      {
        cursor: query.cursor,
        limit: query.limit ?? 25,
      },
    );

    return new PaginatedDto({
      items: await this.toDtosWithTrades(userId, page.items),
      previousCursor: page.previousCursor,
      nextCursor: page.nextCursor,
    });
  }

  async getById(id: string, userId: string): Promise<JournalEntryDto> {
    const row = await this.journalEntryDao.findByIdForUser(id, userId);
    if (!row) {
      throw new NotFoundException(`Journal entry ${id} not found`);
    }
    const [dto] = await this.toDtosWithTrades(userId, [row]);
    return dto;
  }

  async create(
    userId: string,
    dto: CreateJournalEntryDto,
  ): Promise<JournalEntryDto> {
    const tradeIds = await this.resolveTradeIds(userId, dto.tradeIds);

    const row = await this.journalEntryDao.createWithTrades(
      {
        userId,
        date: new Date(dto.date),
        title: dto.title ?? null,
        content: dto.content,
        mood: dto.mood ?? null,
      },
      dto.tradeIds !== undefined ? tradeIds : undefined,
    );
    if (!row) {
      throw new NotFoundException('Failed to create journal entry');
    }
    const [result] = await this.toDtosWithTrades(userId, [row]);
    return result;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateJournalEntryDto,
  ): Promise<JournalEntryDto> {
    const tradeIds =
      dto.tradeIds !== undefined
        ? await this.resolveTradeIds(userId, dto.tradeIds)
        : undefined;

    const { date, tradeIds: _tradeIds, ...rest } = dto;
    const row = await this.journalEntryDao.updateForUserWithTrades(
      id,
      userId,
      {
        ...rest,
        ...(date !== undefined ? { date: new Date(date) } : {}),
      },
      tradeIds,
    );
    if (!row) {
      throw new NotFoundException(`Journal entry ${id} not found`);
    }
    const [result] = await this.toDtosWithTrades(userId, [row]);
    return result;
  }

  async remove(id: string, userId: string): Promise<void> {
    const deleted = await this.journalEntryDao.deleteForUser(id, userId);
    if (!deleted) {
      throw new NotFoundException(`Journal entry ${id} not found`);
    }
  }

  private async resolveTradeIds(
    userId: string,
    tradeIds?: string[],
  ): Promise<string[]> {
    if (!tradeIds || tradeIds.length === 0) {
      return [];
    }

    const unique = [...new Set(tradeIds)];
    if (unique.length > MAX_JOURNAL_ENTRY_TRADES) {
      throw new BadRequestException(
        `A journal entry can link at most ${MAX_JOURNAL_ENTRY_TRADES} trades`,
      );
    }

    const owned = await this.tradeDao.countOwnedByIds(userId, unique);
    if (owned !== unique.length) {
      throw new BadRequestException('One or more trades were not found');
    }

    return unique;
  }

  private async toDtosWithTrades(
    userId: string,
    rows: Parameters<typeof toJournalEntryDto>[0][],
  ): Promise<JournalEntryDto[]> {
    if (rows.length === 0) {
      return [];
    }

    const entryIds = rows.map((r) => r.id);
    const tradeIdsByEntry =
      await this.journalEntryDao.findTradeIdsByJournalEntryIds(entryIds);

    const allTradeIds = [
      ...new Set([...tradeIdsByEntry.values()].flat()),
    ];
    const tradeSummaries = await this.tradeDao.findSummariesByIdsForUser(
      allTradeIds,
      userId,
    );
    const summaryById = new Map(
      tradeSummaries.map((t) => [t.id, t]),
    );

    return rows.map((row) => {
      const tradeIds = tradeIdsByEntry.get(row.id) ?? [];
      const trades: JournalEntryTradeSummaryDto[] = tradeIds
        .map((id) => summaryById.get(id))
        .filter((t): t is JournalEntryTradeSummaryDto => t !== undefined);
      return toJournalEntryDto(row, { tradeIds, trades });
    });
  }
}
