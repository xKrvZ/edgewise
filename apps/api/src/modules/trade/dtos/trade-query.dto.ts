import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationDto } from '@/database/dtos/filter.dto';
import {
  MARKET_TYPES,
  TRADE_DIRECTIONS,
  type MarketType,
  type TradeDirection,
} from '../constants/trade.constants';

export class TradeQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'AAPL' })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by setup (playbook) id' })
  @IsOptional()
  @IsUUID()
  setupId?: string;

  @ApiPropertyOptional({ description: 'Filter by playbook id' })
  @IsOptional()
  @IsUUID()
  playbookId?: string;

  @ApiPropertyOptional({ description: 'Filter by tag id' })
  @IsOptional()
  @IsUUID()
  tagId?: string;

  @ApiPropertyOptional({ description: 'Filter by account id' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ enum: TRADE_DIRECTIONS })
  @IsOptional()
  @IsIn(TRADE_DIRECTIONS)
  direction?: TradeDirection;

  @ApiPropertyOptional({ enum: MARKET_TYPES })
  @IsOptional()
  @IsIn(MARKET_TYPES)
  marketType?: MarketType;
}

export interface TradeFilters {
  symbol?: string;
  dateFrom?: string;
  dateTo?: string;
  setupId?: string;
  playbookId?: string;
  tagId?: string;
  accountId?: string;
  direction?: string;
  marketType?: string;
}
