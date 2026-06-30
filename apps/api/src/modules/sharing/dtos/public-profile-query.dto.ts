import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  DEFAULT_SHOWCASED_TRADES_PAGE_SIZE,
  MAX_SHOWCASED_TRADES_PAGE_SIZE,
} from '../constants/sharing.constants';

export class PublicProfileQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for showcased trades (1-indexed)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of showcased trades per page',
    minimum: 1,
    maximum: MAX_SHOWCASED_TRADES_PAGE_SIZE,
    default: DEFAULT_SHOWCASED_TRADES_PAGE_SIZE,
    example: DEFAULT_SHOWCASED_TRADES_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_SHOWCASED_TRADES_PAGE_SIZE)
  limit?: number = DEFAULT_SHOWCASED_TRADES_PAGE_SIZE;
}
