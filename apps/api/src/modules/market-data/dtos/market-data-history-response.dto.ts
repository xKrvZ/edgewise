import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** UDF history payload (`s: ok`). Times are Unix seconds. */
export class MarketDataHistoryOkDto {
  @ApiProperty({ enum: ['ok'] })
  s: 'ok';

  @ApiProperty({ type: [Number], description: 'Bar open times (Unix seconds)' })
  t: number[];

  @ApiProperty({ type: [Number] })
  o: number[];

  @ApiProperty({ type: [Number] })
  h: number[];

  @ApiProperty({ type: [Number] })
  l: number[];

  @ApiProperty({ type: [Number] })
  c: number[];

  @ApiProperty({ type: [Number] })
  v: number[];
}

/** UDF no-data response. */
export class MarketDataHistoryNoDataDto {
  @ApiProperty({ enum: ['no_data'] })
  s: 'no_data';

  @ApiPropertyOptional({ description: 'Next suggested request time (Unix seconds)' })
  nextTime?: number;
}

/** UDF error response. */
export class MarketDataHistoryErrorDto {
  @ApiProperty({ enum: ['error'] })
  s: 'error';

  @ApiProperty()
  errmsg: string;
}
