import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { Selectable } from 'kysely';
import type { Backtest } from '@/database/types/db';
import { toNumber } from '@/database/utils/numeric.util';
import { MARKET_TYPES, type MarketType } from '@/modules/trade/constants/trade.constants';

export class BacktestDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() userId: string;
  @Expose() @ApiProperty({ example: 'ORB strategy Q1' }) name: string;
  @Expose() @ApiProperty({ example: 'ES' }) symbol: string;

  @Expose()
  @ApiProperty({ enum: MARKET_TYPES, example: 'futures' })
  marketType: MarketType;

  @Expose() @ApiProperty({ type: String, format: 'date' }) startDate: Date;
  @Expose() @ApiProperty({ type: String, format: 'date' }) endDate: Date;
  @Expose() @ApiProperty({ nullable: true }) notes: string | null;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;

  @Expose()
  @ApiProperty({ description: 'Number of simulated trades recorded' })
  tradeCount: number;

  @Expose()
  @ApiProperty({ nullable: true, description: 'Sum of closed-trade P&L' })
  netPnl: number | null;
}

type BacktestRow = Selectable<Backtest> & {
  tradeCount?: number | string | null;
  netPnl?: string | number | null;
};

export function toBacktestDto(row: BacktestRow): BacktestDto {
  const tradeCount =
    row.tradeCount === undefined || row.tradeCount === null
      ? 0
      : Number(row.tradeCount);

  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    symbol: row.symbol,
    marketType: row.marketType as MarketType,
    startDate: row.startDate,
    endDate: row.endDate,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tradeCount,
    netPnl: toNumber(row.netPnl ?? null),
  };
}

export class CreateBacktestDto {
  @ApiProperty({ example: 'ORB strategy Q1' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'ES' })
  @IsString()
  @MaxLength(40)
  symbol: string;

  @ApiProperty({ enum: MARKET_TYPES })
  @IsIn(MARKET_TYPES)
  marketType: MarketType;

  @ApiProperty({ type: String, format: 'date', example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ type: String, format: 'date', example: '2026-03-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBacktestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  symbol?: string;

  @ApiPropertyOptional({ enum: MARKET_TYPES })
  @IsOptional()
  @IsIn(MARKET_TYPES)
  marketType?: MarketType;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
