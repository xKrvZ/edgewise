import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Insertable, Selectable, Updateable } from 'kysely';
import type { Trade } from '@/database/types/db';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { toNumber, toRequiredNumber } from '@/database/utils/numeric.util';
import { AnalyticsCacheService } from '@/modules/analytics/cache/analytics-cache.service';
import { CommunityMemberDao } from '@/modules/community/daos/community-member.dao';
import { InstrumentService } from '@/modules/instrument/services/instrument.service';
import { TradingSessionService } from '@/modules/trading-session/services/trading-session.service';
import { TradeDao } from '../daos/trade.dao';
import { TradeDto, toTradeDto } from '../dtos/trade.dto';
import { CreateTradeDto } from '../dtos/create-trade.dto';
import { UpdateTradeDto } from '../dtos/update-trade.dto';
import { TradeQueryDto } from '../dtos/trade-query.dto';
import type { TradeExitType, TradeStatus } from '../constants/trade.constants';

interface DerivedResult {
  status: TradeStatus;
  pnl: number | null;
  rMultiple: number | null;
}

@Injectable()
export class TradeService {
  constructor(
    private readonly tradeDao: TradeDao,
    private readonly analyticsCache: AnalyticsCacheService,
    private readonly communityMemberDao: CommunityMemberDao,
    private readonly instrumentService: InstrumentService,
    private readonly tradingSessionService: TradingSessionService,
  ) {}

  async list(userId: string, query: TradeQueryDto): Promise<PaginatedDto<TradeDto>> {
    return this.listForUser(userId, query);
  }

  async listForMember(memberUserId: string, query: TradeQueryDto): Promise<PaginatedDto<TradeDto>> {
    return this.listForUser(memberUserId, query);
  }

  private async listForUser(
    userId: string,
    query: TradeQueryDto,
  ): Promise<PaginatedDto<TradeDto>> {
    const limit = query.limit ?? 25;
    const filters = {
      symbol: query.symbol,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      setupId: query.setupId,
      playbookId: query.playbookId,
      tagId: query.tagId,
      accountId: query.accountId,
      direction: query.direction,
      marketType: query.marketType,
    };

    const page = await this.tradeDao.findCursorPaged(userId, filters, {
      cursor: query.cursor,
      limit,
    });

    const { tags, mistakes } = await this.tradeDao.getRelationIdsForTrades(
      page.items.map((t) => t.id),
    );

    return new PaginatedDto<TradeDto>({
      items: page.items.map((row) =>
        toTradeDto(row, {
          tagIds: tags.get(row.id) ?? [],
          mistakeIds: mistakes.get(row.id) ?? [],
        }),
      ),
      previousCursor: page.previousCursor,
      nextCursor: page.nextCursor,
    });
  }

  async getById(id: string, userId: string): Promise<TradeDto> {
    let row = await this.tradeDao.findByIdForUser(id, userId);
    if (!row) {
      const trade = await this.tradeDao.findById(id);
      if (
        !trade ||
        !(await this.communityMemberDao.canMentorViewMemberContent(
          userId,
          trade.userId,
        ))
      ) {
        throw new NotFoundException(`Trade ${id} not found`);
      }
      row = trade;
    }
    return this.toDtoWithRelations(row);
  }

  async create(userId: string, dto: CreateTradeDto): Promise<TradeDto> {
    const symbol = await this.resolveSymbol(dto.symbol);
    const tagIds = await this.resolveTagIds(userId, dto.tagIds);
    const mistakeIds = await this.resolveMistakeIds(userId, dto.mistakeIds);

    const stopLoss = dto.stopLoss ?? null;
    const fees = dto.fees ?? 0;
    const exitPrice = this.resolveExitPrice({
      exitType: dto.exitType,
      exitPrice: dto.exitPrice,
      stopLoss,
      takeProfit: dto.takeProfit ?? null,
    });
    const entryTime = new Date(dto.entryTime);
    const sessionId = await this.resolveSessionId(
      userId,
      entryTime,
      dto.timezone,
      dto.sessionId,
      dto.sessionId === undefined,
    );

    const derived = this.computeDerived({
      direction: dto.direction,
      entryPrice: dto.entryPrice,
      exitPrice,
      quantity: dto.quantity,
      fees,
      stopLoss,
      explicitPnl: dto.pnl,
      explicitRMultiple: dto.rMultiple,
    });
    const exitTime = this.resolveExitTime(exitPrice, dto.exitTime);

    const insert: Insertable<Trade> = {
      userId,
      accountId: dto.accountId,
      symbol,
      marketType: dto.marketType,
      direction: dto.direction,
      entryPrice: dto.entryPrice,
      exitPrice,
      quantity: dto.quantity,
      stopLoss,
      takeProfit: dto.takeProfit ?? null,
      fees,
      pnl: derived.pnl,
      rMultiple: derived.rMultiple,
      entryTime,
      exitTime,
      setupId: dto.setupId ?? null,
      playbookId: dto.playbookId ?? null,
      sessionId,
      emotion: dto.emotion ?? null,
      executionRating: dto.executionRating ?? null,
      notes: dto.notes ?? null,
      status: derived.status,
    };

    const row = await this.tradeDao.createWithRelations(
      insert,
      dto.tagIds !== undefined ? tagIds : undefined,
      dto.mistakeIds !== undefined ? mistakeIds : undefined,
    );
    if (!row) {
      throw new BadRequestException('Failed to create trade');
    }
    await this.analyticsCache.invalidateUser(userId);
    return this.toDtoWithRelations(row);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTradeDto,
  ): Promise<TradeDto> {
    const existing = await this.tradeDao.findByIdForUser(id, userId);
    if (!existing) {
      throw new NotFoundException(`Trade ${id} not found`);
    }

    const tagIds = await this.resolveTagIds(userId, dto.tagIds);
    const mistakeIds = await this.resolveMistakeIds(userId, dto.mistakeIds);

    // Merge incoming values over the persisted trade so derived fields can be
    // recomputed from the effective state.
    const direction = dto.direction ?? existing.direction;
    const entryPrice =
      dto.entryPrice ?? toRequiredNumber(existing.entryPrice);
    const quantity = dto.quantity ?? toRequiredNumber(existing.quantity);
    const fees = dto.fees ?? toRequiredNumber(existing.fees);
    const stopLoss =
      dto.stopLoss !== undefined ? dto.stopLoss : toNumber(existing.stopLoss);
    const takeProfit =
      dto.takeProfit !== undefined
        ? dto.takeProfit
        : toNumber(existing.takeProfit);
    const exitPrice = this.resolveExitPrice({
      exitType: dto.exitType,
      exitPrice:
        dto.exitPrice !== undefined ? dto.exitPrice : toNumber(existing.exitPrice),
      stopLoss,
      takeProfit,
    });
    const entryTime =
      dto.entryTime !== undefined
        ? new Date(dto.entryTime)
        : existing.entryTime;
    const sessionId = await this.resolveSessionId(
      userId,
      entryTime,
      dto.timezone,
      dto.sessionId !== undefined ? dto.sessionId : existing.sessionId,
      dto.entryTime !== undefined || dto.timezone !== undefined,
    );

    const symbol =
      dto.symbol !== undefined ? await this.resolveSymbol(dto.symbol) : undefined;

    const derived = this.computeDerived({
      direction,
      entryPrice,
      exitPrice,
      quantity,
      fees,
      stopLoss,
      explicitPnl: dto.pnl,
      explicitRMultiple: dto.rMultiple,
    });
    const exitTime = this.resolveExitTime(
      exitPrice,
      dto.exitTime,
      existing.exitTime,
    );

    const data: Updateable<Trade> = {
      ...(dto.accountId !== undefined ? { accountId: dto.accountId } : {}),
      ...(symbol !== undefined ? { symbol } : {}),
      ...(dto.marketType !== undefined ? { marketType: dto.marketType } : {}),
      ...(dto.direction !== undefined ? { direction: dto.direction } : {}),
      ...(dto.entryPrice !== undefined ? { entryPrice: dto.entryPrice } : {}),
      ...(dto.exitPrice !== undefined ? { exitPrice } : {}),
      ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
      ...(dto.stopLoss !== undefined ? { stopLoss } : {}),
      ...(dto.takeProfit !== undefined ? { takeProfit: dto.takeProfit } : {}),
      ...(dto.fees !== undefined ? { fees: dto.fees } : {}),
      ...(dto.setupId !== undefined ? { setupId: dto.setupId } : {}),
      ...(dto.playbookId !== undefined ? { playbookId: dto.playbookId } : {}),
      sessionId,
      ...(dto.emotion !== undefined ? { emotion: dto.emotion } : {}),
      ...(dto.executionRating !== undefined
        ? { executionRating: dto.executionRating }
        : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      ...(dto.entryTime !== undefined
        ? { entryTime: new Date(dto.entryTime) }
        : {}),
      exitTime,
      pnl: derived.pnl,
      rMultiple: derived.rMultiple,
      status: derived.status,
    };

    const row = await this.tradeDao.updateForUserWithRelations(
      id,
      userId,
      data,
      dto.tagIds !== undefined ? tagIds : undefined,
      dto.mistakeIds !== undefined ? mistakeIds : undefined,
    );
    if (!row) {
      throw new NotFoundException(`Trade ${id} not found`);
    }
    await this.analyticsCache.invalidateUser(userId);
    return this.toDtoWithRelations(row);
  }

  async remove(id: string, userId: string): Promise<void> {
    const deleted = await this.tradeDao.deleteForUser(id, userId);
    if (!deleted) {
      throw new NotFoundException(`Trade ${id} not found`);
    }
    await this.analyticsCache.invalidateUser(userId);
  }

  // ==================== Helpers ====================

  private resolveExitTime(
    exitPrice: number | null,
    exitTime: string | null | undefined,
    existingExitTime?: Date | null,
  ): Date | null {
    if (exitPrice === null) {
      return null;
    }

    const resolved =
      exitTime !== undefined
        ? exitTime
          ? new Date(exitTime)
          : null
        : (existingExitTime ?? null);

    if (!resolved || Number.isNaN(resolved.getTime())) {
      throw new BadRequestException(
        'exitTime is required for closed trades',
      );
    }

    return resolved;
  }

  private resolveExitPrice(input: {
    exitType?: TradeExitType;
    exitPrice?: number | null;
    stopLoss: number | null;
    takeProfit: number | null;
  }): number | null {
    if (input.exitType === 'stop_loss') {
      if (input.stopLoss === null || input.stopLoss === undefined) {
        throw new BadRequestException(
          'stopLoss is required when exitType is stop_loss',
        );
      }
      return input.stopLoss;
    }
    if (input.exitType === 'take_profit') {
      if (input.takeProfit === null || input.takeProfit === undefined) {
        throw new BadRequestException(
          'takeProfit is required when exitType is take_profit',
        );
      }
      return input.takeProfit;
    }
    if (input.exitType === 'custom') {
      if (input.exitPrice === null || input.exitPrice === undefined) {
        throw new BadRequestException(
          'exitPrice is required when exitType is custom',
        );
      }
      return input.exitPrice;
    }
    return input.exitPrice ?? null;
  }

  private async resolveSessionId(
    userId: string,
    entryTime: Date,
    timezone: string | undefined,
    explicitSessionId: string | null | undefined,
    shouldReResolve: boolean,
  ): Promise<string | null> {
    if (explicitSessionId && !shouldReResolve) {
      return explicitSessionId;
    }
    const resolved = await this.tradingSessionService.resolveForTimestamp(
      userId,
      entryTime,
      timezone,
    );
    return resolved ?? explicitSessionId ?? null;
  }

  /**
   * Derives status, P&L and R-multiple from the trade's economics. Explicit
   * values supplied by the caller take precedence; otherwise they are computed.
   */
  private computeDerived(input: {
    direction: string;
    entryPrice: number;
    exitPrice: number | null;
    quantity: number;
    fees: number;
    stopLoss: number | null;
    explicitPnl?: number | null;
    explicitRMultiple?: number | null;
  }): DerivedResult {
    const status: TradeStatus = input.exitPrice === null ? 'open' : 'closed';

    if (status === 'open') {
      return { status, pnl: null, rMultiple: null };
    }

    const exitPrice = input.exitPrice as number;
    const gross =
      input.direction === 'short'
        ? (input.entryPrice - exitPrice) * input.quantity
        : (exitPrice - input.entryPrice) * input.quantity;
    const computedPnl = gross - input.fees;
    const pnl =
      input.explicitPnl !== undefined && input.explicitPnl !== null
        ? input.explicitPnl
        : computedPnl;

    let rMultiple: number | null = null;
    if (input.stopLoss !== null && input.stopLoss !== undefined) {
      const risk = Math.abs(input.entryPrice - input.stopLoss) * input.quantity;
      rMultiple = risk > 0 ? pnl / risk : null;
    }
    if (
      input.explicitRMultiple !== undefined &&
      input.explicitRMultiple !== null
    ) {
      rMultiple = input.explicitRMultiple;
    }

    return { status, pnl, rMultiple };
  }

  private async resolveSymbol(symbol: string): Promise<string> {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) {
      throw new BadRequestException('Symbol is required');
    }
    const known = await this.instrumentService.isKnownSymbol(normalized);
    if (!known) {
      throw new BadRequestException(
        `Unknown symbol "${normalized}". Select a symbol from the instrument catalog.`,
      );
    }
    return normalized;
  }

  private async resolveTagIds(
    userId: string,
    tagIds?: string[],
  ): Promise<string[]> {
    if (tagIds === undefined) {
      return [];
    }
    const unique = [...new Set(tagIds)];
    const owned = await this.tradeDao.filterOwnedTagIds(userId, unique);
    if (owned.length !== unique.length) {
      throw new BadRequestException(
        'One or more tagIds do not exist or do not belong to the user',
      );
    }
    return unique;
  }

  private async resolveMistakeIds(
    userId: string,
    mistakeIds?: string[],
  ): Promise<string[]> {
    if (mistakeIds === undefined) {
      return [];
    }
    const unique = [...new Set(mistakeIds)];
    const owned = await this.tradeDao.filterOwnedMistakeIds(userId, unique);
    if (owned.length !== unique.length) {
      throw new BadRequestException(
        'One or more mistakeIds do not exist or do not belong to the user',
      );
    }
    return unique;
  }

  private async toDtoWithRelations(row: Selectable<Trade>): Promise<TradeDto> {
    const [tagIds, mistakeIds] = await Promise.all([
      this.tradeDao.getTagIds(row.id),
      this.tradeDao.getMistakeIds(row.id),
    ]);
    return toTradeDto(row, { tagIds, mistakeIds });
  }
}
