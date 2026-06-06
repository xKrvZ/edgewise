import { ApiProperty } from '@nestjs/swagger';
import { CandleDto } from '@/modules/market-data/dtos/candle.dto';

/** Server → client `candles:snapshot` payload (snapshot mode). */
export class CandlesSnapshotDto {
  @ApiProperty() requestId: string;
  @ApiProperty({ type: [CandleDto] }) candles: CandleDto[];
}

/** Server → client `candles:tick` payload (replay mode). */
export class CandlesTickDto {
  @ApiProperty() requestId: string;
  @ApiProperty({ type: CandleDto }) candle: CandleDto;
}

/** Server → client `candles:complete` payload (end of a replay stream). */
export class CandlesCompleteDto {
  @ApiProperty() requestId: string;
}

/** Server → client `candles:error` payload. */
export class CandlesErrorDto {
  @ApiProperty() requestId: string;
  @ApiProperty() message: string;
}
