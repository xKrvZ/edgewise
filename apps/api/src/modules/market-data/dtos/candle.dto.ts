import { ApiProperty } from '@nestjs/swagger';

/** Wire shape of a single OHLCV candle. */
export class CandleDto {
  @ApiProperty({ description: 'Epoch ms of the candle open' })
  time: number;

  @ApiProperty() open: number;
  @ApiProperty() high: number;
  @ApiProperty() low: number;
  @ApiProperty() close: number;
  @ApiProperty() volume: number;
}
