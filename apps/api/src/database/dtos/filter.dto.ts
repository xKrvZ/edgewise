import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsBoolean, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export type SortOrder = 'asc' | 'desc';

export class OrderByDto {
  @ApiPropertyOptional({
    description: 'Field to order by',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  direction?: SortOrder;
}

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Cursor for pagination (from previous response)',
    example: 'eyJpZCI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsImZpbHRlcnMiOnt9fQ==',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
