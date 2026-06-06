import { ApiProperty } from '@nestjs/swagger';

/** Minimal UDF /datafeed config for TradingView Charting Library. */
export class MarketDataConfigResponseDto {
  @ApiProperty({ example: true })
  supports_search: boolean;

  @ApiProperty({ example: true })
  supports_group_request: boolean;

  @ApiProperty({ example: true })
  supports_marks: boolean;

  @ApiProperty({ example: true })
  supports_timescale_marks: boolean;

  @ApiProperty({ example: false })
  supports_time: boolean;

  @ApiProperty({ type: [String], example: ['1', '5', '15', '60', '240', 'D'] })
  supported_resolutions: string[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: { name: { type: 'string' }, value: { type: 'string' } },
    },
  })
  symbols_types: Array<{ name: string; value: string }>;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        value: { type: 'string' },
        name: { type: 'string' },
        desc: { type: 'string' },
      },
    },
  })
  exchanges: Array<{ value: string; name: string; desc: string }>;
}
