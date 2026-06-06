import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import {
  TRADE_VISIBILITIES,
  type TradeVisibility,
} from '../constants/sharing.constants';

export class UpdateTradeSharingDto {
  @ApiProperty({ enum: TRADE_VISIBILITIES, example: 'unlisted' })
  @IsIn(TRADE_VISIBILITIES)
  visibility: TradeVisibility;
}
