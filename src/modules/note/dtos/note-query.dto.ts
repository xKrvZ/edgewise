import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, ValidateNested, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SUPPORTED_ENTITY_TYPES } from '../constants/entity-types.constants';
import { OrderByDto, PaginationDto } from '@/database/dtos/filter.dto';

export class NoteQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'ID of the entity to filter notes by',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Type of entity to filter notes by',
    example: 'Punishment',
    enum: SUPPORTED_ENTITY_TYPES,
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    // Handle array case (query params can be arrays)
    const stringValue = Array.isArray(value) ? value[0] : value;
    if (typeof stringValue !== 'string' || stringValue.length === 0) {
      return undefined;
    }
    // Find matching supported type (case-insensitive) and return the exact matched type
    const matchedType = SUPPORTED_ENTITY_TYPES.find(
      (type) => type.toLowerCase() === stringValue.toLowerCase(),
    );
    // Return the exact supported type (preserves camelCase like "AbuseReport")
    return matchedType || stringValue;
  })
  @IsOptional()
  @IsString()
  @IsIn([...SUPPORTED_ENTITY_TYPES], {
    message: `entityType must be one of: ${SUPPORTED_ENTITY_TYPES.join(', ')}`,
  })
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Order by field and direction',
    type: OrderByDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderByDto)
  orderBy?: OrderByDto;
}
