import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  MARKET_TYPES,
  TRADE_DIRECTIONS,
  TRADE_STATUSES,
} from '@/modules/trade/constants/trade.constants';

export class PublicShowcasedTradeDto {
  @Expose()
  @ApiProperty({ description: 'Trade id (for owner actions on the public profile page)' })
  tradeId: string;

  @Expose()
  @ApiProperty({ description: 'Opaque share token for the public trade URL' })
  shareToken: string;

  @Expose()
  @ApiProperty({ example: 'ES' })
  symbol: string;

  @Expose()
  @ApiProperty({ enum: TRADE_DIRECTIONS })
  direction: string;

  @Expose()
  @ApiProperty({ enum: MARKET_TYPES })
  marketType: string;

  @Expose()
  @ApiProperty({ nullable: true, example: 125.5 })
  pnl: number | null;

  @Expose()
  @ApiProperty({ nullable: true, example: 1.25 })
  rMultiple: number | null;

  @Expose()
  @ApiProperty({ enum: TRADE_STATUSES })
  status: string;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  entryTime: Date;

  @Expose()
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  exitTime: Date | null;

  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Presigned URL for the first public screenshot on the trade, if any',
  })
  thumbnailUrl: string | null;
}
