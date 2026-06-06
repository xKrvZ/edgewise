import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/**
 * UDF-compatible history query. `from` / `to` are Unix seconds (TradingView
 * convention). Pass `resolution` as a TV string (`1`, `5`, `60`, `D`, …) or
 * an internal interval (`1m`, `5m`, …).
 */
export class MarketDataHistoryQueryDto {
  @ApiProperty({ example: 'AAPL' })
  @IsString()
  @MaxLength(32)
  symbol: string;

  @ApiProperty({
    description: 'TradingView resolution or internal interval',
    example: '5',
  })
  @IsString()
  @MaxLength(8)
  resolution: string;

  @ApiProperty({ description: 'Inclusive start (Unix seconds)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  from: number;

  @ApiProperty({ description: 'Inclusive end (Unix seconds)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  to: number;

  @ApiPropertyOptional({
    description: 'UDF countback hint (ignored; window is from/to)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  countback?: number;
}
