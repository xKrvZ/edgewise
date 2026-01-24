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
