import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderByDto, PaginationDto } from '@/database/dtos/filter.dto';

export class PlayerQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by game identifier',
    type: String,
    example: 'hytale',
  })
  @IsOptional()
  @IsString()
  game?: string;

  @ApiPropertyOptional({
    description: 'Order by field and direction',
    type: OrderByDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderByDto)
  orderBy?: OrderByDto;
}
