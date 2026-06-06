import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CANDLE_INTERVALS,
  type CandleInterval,
  MAX_REPLAY_SPEED,
  MIN_REPLAY_SPEED,
} from '@/modules/market-data/constants/market-data.constants';

export const SUBSCRIBE_MODES = ['snapshot', 'replay'] as const;
export type SubscribeMode = (typeof SUBSCRIBE_MODES)[number];

/**
 * Payload for the client → server `candles:subscribe` event. A `snapshot`
 * request replies once with `candles:snapshot`; a `replay` request streams
 * `candles:tick` events then a final `candles:complete`.
 */
export class CandlesSubscribeDto {
  @ApiProperty({ description: 'Client-generated id correlating responses' })
  @IsString()
  @MaxLength(128)
  requestId: string;

  @ApiProperty({ example: 'AAPL' })
  @IsString()
  @MaxLength(32)
  symbol: string;

  @ApiProperty({ enum: CANDLE_INTERVALS })
  @IsIn(CANDLE_INTERVALS)
  interval: CandleInterval;

  @ApiProperty({ description: 'Inclusive start (epoch ms)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  from: number;

  @ApiProperty({ description: 'Inclusive end (epoch ms)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  to: number;

  @ApiProperty({ enum: SUBSCRIBE_MODES })
  @IsIn(SUBSCRIBE_MODES)
  mode: SubscribeMode;

  @ApiPropertyOptional({
    description: 'Replay playback speed multiplier (replay mode only)',
    minimum: MIN_REPLAY_SPEED,
    maximum: MAX_REPLAY_SPEED,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(MIN_REPLAY_SPEED)
  @Max(MAX_REPLAY_SPEED)
  speed?: number;
}
