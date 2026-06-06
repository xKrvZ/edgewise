import { Injectable, NotFoundException } from '@nestjs/common';
import { BacktestDao } from '../daos/backtest.dao';
import { BacktestTradeDao } from '../daos/backtest-trade.dao';
import { BacktestAnalyticsService } from './backtest-analytics.service';
import {
  BacktestDto,
  CreateBacktestDto,
  UpdateBacktestDto,
  toBacktestDto,
} from '../dtos/backtest.dto';
import {
  BacktestTradeDto,
  CreateBacktestTradeDto,
  toBacktestTradeDto,
} from '../dtos/backtest-trade.dto';

@Injectable()
export class BacktestService {
  constructor(
    private readonly backtestDao: BacktestDao,
    private readonly backtestTradeDao: BacktestTradeDao,
    private readonly backtestAnalyticsService: BacktestAnalyticsService,
  ) {}

  async list(userId: string): Promise<BacktestDto[]> {
    const [rows, stats] = await Promise.all([
      this.backtestDao.findAllByUser(userId),
      this.backtestTradeDao.findStatsByUser(userId),
    ]);
    const statsByBacktest = new Map(
      stats.map((s) => [s.backtestId, s] as const),
    );

    return rows.map((row) => {
      const rowStats = statsByBacktest.get(row.id);
      return toBacktestDto({
        ...row,
        tradeCount: rowStats?.tradeCount ?? 0,
        netPnl: rowStats?.netPnl ?? null,
      });
    });
  }

  async getById(id: string, userId: string): Promise<BacktestDto> {
    const row = await this.backtestDao.findByIdForUser(id, userId);
    if (!row) {
      throw new NotFoundException(`Backtest ${id} not found`);
    }
    return toBacktestDto(row);
  }

  async create(userId: string, dto: CreateBacktestDto): Promise<BacktestDto> {
    const row = await this.backtestDao.create({
      userId,
      name: dto.name,
      symbol: dto.symbol,
      marketType: dto.marketType,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      notes: dto.notes ?? null,
    });
    if (!row) {
      throw new NotFoundException('Failed to create backtest');
    }
    return toBacktestDto(row);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateBacktestDto,
  ): Promise<BacktestDto> {
    const { startDate, endDate, ...rest } = dto;
    const row = await this.backtestDao.updateForUser(id, userId, {
      ...rest,
      ...(startDate !== undefined ? { startDate: new Date(startDate) } : {}),
      ...(endDate !== undefined ? { endDate: new Date(endDate) } : {}),
    });
    if (!row) {
      throw new NotFoundException(`Backtest ${id} not found`);
    }
    return toBacktestDto(row);
  }

  async remove(id: string, userId: string): Promise<void> {
    const deleted = await this.backtestDao.deleteForUser(id, userId);
    if (!deleted) {
      throw new NotFoundException(`Backtest ${id} not found`);
    }
  }

  // ==================== Backtest trades ====================

  private async assertOwnedBacktest(
    backtestId: string,
    userId: string,
  ): Promise<void> {
    const backtest = await this.backtestDao.findByIdForUser(backtestId, userId);
    if (!backtest) {
      throw new NotFoundException(`Backtest ${backtestId} not found`);
    }
  }

  async listTrades(
    backtestId: string,
    userId: string,
  ): Promise<BacktestTradeDto[]> {
    await this.assertOwnedBacktest(backtestId, userId);
    const rows = await this.backtestTradeDao.findByBacktest(backtestId);
    return rows.map(toBacktestTradeDto);
  }

  async addTrade(
    backtestId: string,
    userId: string,
    dto: CreateBacktestTradeDto,
  ): Promise<BacktestTradeDto> {
    await this.assertOwnedBacktest(backtestId, userId);
    const row = await this.backtestTradeDao.create({
      backtestId,
      userId,
      symbol: dto.symbol,
      direction: dto.direction,
      entryPrice: dto.entryPrice,
      exitPrice: dto.exitPrice ?? null,
      quantity: dto.quantity,
      stopLoss: dto.stopLoss ?? null,
      takeProfit: dto.takeProfit ?? null,
      fees: dto.fees ?? 0,
      pnl: dto.pnl ?? null,
      rMultiple: dto.rMultiple ?? null,
      entryTime: new Date(dto.entryTime),
      exitTime: dto.exitTime ? new Date(dto.exitTime) : null,
      notes: dto.notes ?? null,
    });
    if (!row) {
      throw new NotFoundException('Failed to create backtest trade');
    }
    await this.backtestAnalyticsService.invalidate(backtestId, userId);
    return toBacktestTradeDto(row);
  }

  async removeTrade(
    backtestId: string,
    tradeId: string,
    userId: string,
  ): Promise<void> {
    await this.assertOwnedBacktest(backtestId, userId);
    const deleted = await this.backtestTradeDao.deleteForBacktest(
      tradeId,
      backtestId,
    );
    if (!deleted) {
      throw new NotFoundException(`Backtest trade ${tradeId} not found`);
    }
    await this.backtestAnalyticsService.invalidate(backtestId, userId);
  }
}
