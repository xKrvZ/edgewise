import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MARKET_TYPES,
  TRADE_DIRECTIONS,
  TRADE_EXIT_TYPES,
  TRADE_STATUSES,
  type MarketType,
  type TradeDirection,
  type TradeExitType,
  type TradeStatus,
} from '../constants/trade.constants';

export class CreateTradeDto {
  @ApiProperty({ description: 'Trading account id this trade belongs to' })
  @IsUUID()
  accountId: string;

  @ApiProperty({
    example: 'AAPL',
    description: 'Canonical symbol from the instrument catalog',
  })
  @IsString()
  @MaxLength(40)
  symbol: string;

  @ApiProperty({ enum: MARKET_TYPES })
  @IsIn(MARKET_TYPES)
  marketType: MarketType;

  @ApiProperty({ enum: TRADE_DIRECTIONS })
  @IsIn(TRADE_DIRECTIONS)
  direction: TradeDirection;

  @ApiProperty({ example: 185.4 })
  @IsNumber()
  entryPrice: number;

  @ApiPropertyOptional({ example: 191.2 })
  @IsOptional()
  @IsNumber()
  exitPrice?: number;

  @ApiProperty({ example: 100 })
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

  @ApiPropertyOptional({ example: 575.0 })
  @IsOptional()
  @IsNumber()
  pnl?: number;

  @ApiPropertyOptional({ example: 2.1 })
  @IsOptional()
  @IsNumber()
  rMultiple?: number;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  entryTime: string;

  @ApiPropertyOptional({
    example: 'America/New_York',
    description:
      'IANA timezone used when logging the trade (for session assignment)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  exitTime?: string;

  @ApiPropertyOptional({
    enum: TRADE_EXIT_TYPES,
    description:
      'How the trade was closed: stop_loss, take_profit, or custom exit price',
  })
  @IsOptional()
  @IsIn(TRADE_EXIT_TYPES)
  exitType?: TradeExitType;

  @ApiPropertyOptional({ description: 'Playbook id used as the trade setup' })
  @IsOptional()
  @IsUUID()
  setupId?: string;

  @ApiPropertyOptional({ description: 'Playbook id associated with the trade' })
  @IsOptional()
  @IsUUID()
  playbookId?: string;

  @ApiPropertyOptional({ description: 'Trading session id' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional({ example: 'confident' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  emotion?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  executionRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: TRADE_STATUSES, default: 'closed' })
  @IsOptional()
  @IsIn(TRADE_STATUSES)
  status?: TradeStatus;

  @ApiPropertyOptional({
    description: 'Tag ids to associate with the trade (replaces existing links)',
    type: String,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    description:
      'Mistake ids to associate with the trade (replaces existing links)',
    type: String,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  mistakeIds?: string[];
}
