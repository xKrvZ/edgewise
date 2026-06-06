import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Offset-based pagination query parameters. Used by list endpoints that expose
 * page/limit style pagination (e.g. the trades list).
 */
export class PageQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
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
    description: 'Number of items per page',
    minimum: 1,
    maximum: 200,
    default: 25,
    example: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 25;
}

/**
 * Generic offset-paginated response envelope.
 */
export class PageDto<T> {
  @Expose()
  @ApiProperty({ description: 'Items for the current page', isArray: true })
  items: T[];

  @Expose()
  @ApiProperty({ description: 'Total number of matching items', example: 128 })
  total: number;

  @Expose()
  @ApiProperty({ description: 'Current page (1-indexed)', example: 1 })
  page: number;

  @Expose()
  @ApiProperty({ description: 'Items per page', example: 25 })
  limit: number;

  @Expose()
  @ApiProperty({ description: 'Total number of pages', example: 6 })
  pageCount: number;

  constructor(data: { items: T[]; total: number; page: number; limit: number }) {
    this.items = data.items;
    this.total = data.total;
    this.page = data.page;
    this.limit = data.limit;
    this.pageCount = data.limit > 0 ? Math.ceil(data.total / data.limit) : 0;
  }
}
