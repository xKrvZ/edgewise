import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  TRADE_VISIBILITIES,
  type TradeVisibility,
} from '../constants/sharing.constants';

export class TradeSharingDto {
  @Expose()
  @ApiProperty({ enum: TRADE_VISIBILITIES })
  visibility: TradeVisibility;

  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Opaque share token; null when visibility is private',
  })
  shareToken: string | null;
}
