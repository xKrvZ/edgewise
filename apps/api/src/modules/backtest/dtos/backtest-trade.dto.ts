import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { Selectable } from 'kysely';
import type { BacktestTrade } from '@/database/types/db';
import { toNumber, toRequiredNumber } from '@/database/utils/numeric.util';
import {
  TRADE_DIRECTIONS,
  type TradeDirection,
} from '@/modules/trade/constants/trade.constants';

export class BacktestTradeDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() backtestId: string;
  @Expose() @ApiProperty() userId: string;
  @Expose() @ApiProperty({ example: 'ES' }) symbol: string;

  @Expose()
  @ApiProperty({ enum: TRADE_DIRECTIONS })
  direction: TradeDirection;

  @Expose() @ApiProperty() entryPrice: number;
  @Expose() @ApiProperty({ nullable: true }) exitPrice: number | null;
  @Expose() @ApiProperty() quantity: number;
  @Expose() @ApiProperty({ nullable: true }) stopLoss: number | null;
  @Expose() @ApiProperty({ nullable: true }) takeProfit: number | null;
  @Expose() @ApiProperty() fees: number;
  @Expose() @ApiProperty({ nullable: true }) pnl: number | null;
  @Expose() @ApiProperty({ nullable: true }) rMultiple: number | null;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) entryTime: Date;
  @Expose()
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  exitTime: Date | null;
  @Expose() @ApiProperty({ nullable: true }) notes: string | null;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
}

export function toBacktestTradeDto(
  row: Selectable<BacktestTrade>,
): BacktestTradeDto {
  return {
    id: row.id,
    backtestId: row.backtestId,
    userId: row.userId,
    symbol: row.symbol,
    direction: row.direction as TradeDirection,
    entryPrice: toRequiredNumber(row.entryPrice),
    exitPrice: toNumber(row.exitPrice),
    quantity: toRequiredNumber(row.quantity),
    stopLoss: toNumber(row.stopLoss),
    takeProfit: toNumber(row.takeProfit),
    fees: toRequiredNumber(row.fees),
    pnl: toNumber(row.pnl),
    rMultiple: toNumber(row.rMultiple),
    entryTime: row.entryTime,
    exitTime: row.exitTime,
    notes: row.notes,
    createdAt: row.createdAt,
  };
}

export class CreateBacktestTradeDto {
  @ApiProperty({ example: 'ES' })
  @IsString()
  @MaxLength(40)
  symbol: string;

  @ApiProperty({ enum: TRADE_DIRECTIONS })
  @IsIn(TRADE_DIRECTIONS)
  direction: TradeDirection;

  @ApiProperty()
  @IsNumber()
  entryPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  exitPrice?: number;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  stopLoss?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  takeProfit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  fees?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pnl?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rMultiple?: number;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  entryTime: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  exitTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
