import { Injectable, NotFoundException } from '@nestjs/common';
import { TradingSessionDao } from '../daos/trading-session.dao';
import {
  TradingSessionDto,
  toTradingSessionDto,
} from '../dtos/trading-session.dto';
import { CreateTradingSessionDto } from '../dtos/create-trading-session.dto';
import { UpdateTradingSessionDto } from '../dtos/update-trading-session.dto';

@Injectable()
export class TradingSessionService {
  constructor(private readonly tradingSessionDao: TradingSessionDao) {}

  async list(userId: string): Promise<TradingSessionDto[]> {
    const rows = await this.tradingSessionDao.findAllByUser(userId);
    return rows.map(toTradingSessionDto);
  }

  async getById(id: string, userId: string): Promise<TradingSessionDto> {
    const row = await this.tradingSessionDao.findByIdForUser(id, userId);
    if (!row) {
      throw new NotFoundException(`Trading session ${id} not found`);
    }
    return toTradingSessionDto(row);
  }

  async create(
    userId: string,
    dto: CreateTradingSessionDto,
  ): Promise<TradingSessionDto> {
    const row = await this.tradingSessionDao.create({
      userId,
      name: dto.name,
      startTime: dto.startTime,
      endTime: dto.endTime,
      timezone: dto.timezone ?? null,
    });
    if (!row) {
      throw new NotFoundException('Failed to create trading session');
    }
    return toTradingSessionDto(row);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTradingSessionDto,
  ): Promise<TradingSessionDto> {
    const row = await this.tradingSessionDao.updateForUser(id, userId, {
      ...dto,
    });
    if (!row) {
      throw new NotFoundException(`Trading session ${id} not found`);
    }
    return toTradingSessionDto(row);
  }

  async remove(id: string, userId: string): Promise<void> {
    const deleted = await this.tradingSessionDao.deleteForUser(id, userId);
    if (!deleted) {
      throw new NotFoundException(`Trading session ${id} not found`);
    }
  }
}
