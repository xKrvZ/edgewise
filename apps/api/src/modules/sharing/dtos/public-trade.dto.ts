import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  MARKET_TYPES,
  TRADE_DIRECTIONS,
  TRADE_STATUSES,
  type MarketType,
  type TradeDirection,
  type TradeStatus,
} from '@/modules/trade/constants/trade.constants';
import {
  TRADE_VISIBILITIES,
  type TradeVisibility,
} from '../constants/sharing.constants';
import { PublicTradeMediaDto } from './public-trade-media.dto';
import { PublicTradeTraderDto } from './public-trade-trader.dto';

export class PublicTradeDto {
  @Expose() @ApiProperty({ example: 'AAPL' }) symbol: string;

  @Expose()
  @ApiProperty({ enum: MARKET_TYPES })
  marketType: MarketType;

  @Expose()
  @ApiProperty({ enum: TRADE_DIRECTIONS })
  direction: TradeDirection;

  @Expose() @ApiProperty({ example: 185.4 }) entryPrice: number;
  @Expose() @ApiProperty({ nullable: true, example: 191.2 }) exitPrice: number | null;
  @Expose() @ApiProperty({ example: 100 }) quantity: number;
  @Expose() @ApiProperty({ nullable: true }) stopLoss: number | null;
  @Expose() @ApiProperty({ nullable: true }) takeProfit: number | null;
  @Expose() @ApiProperty({ example: 1.5 }) fees: number;
  @Expose() @ApiProperty({ nullable: true, example: 575.0 }) pnl: number | null;
  @Expose() @ApiProperty({ nullable: true, example: 2.1 }) rMultiple: number | null;

  @Expose() @ApiProperty({ type: String, format: 'date-time' }) entryTime: Date;
  @Expose()
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  exitTime: Date | null;

  @Expose() @ApiProperty({ nullable: true, example: 'confident' }) emotion: string | null;
  @Expose()
  @ApiProperty({ nullable: true, minimum: 1, maximum: 5, example: 4 })
  executionRating: number | null;

  @Expose() @ApiProperty({ nullable: true }) notes: string | null;
  @Expose() @ApiProperty({ enum: TRADE_STATUSES }) status: TradeStatus;

  @Expose()
  @ApiProperty({ nullable: true, example: 'Opening Range Breakout' })
  setupName: string | null;

  @Expose()
  @ApiProperty({ nullable: true, example: 'New York' })
  sessionName: string | null;

  @Expose()
  @ApiProperty({ type: String, isArray: true, example: ['Breakout', 'Trend'] })
  tagNames: string[];

  @Expose()
  @ApiProperty({ enum: TRADE_VISIBILITIES })
  visibility: TradeVisibility;

  @Expose()
  @ApiProperty({ type: PublicTradeMediaDto, isArray: true })
  media: PublicTradeMediaDto[];

  @Expose()
  @ApiProperty({ type: PublicTradeTraderDto })
  @Type(() => PublicTradeTraderDto)
  trader: PublicTradeTraderDto;
}
