import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, ValidateNested, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderByDto, PaginationDto } from '@/database/dtos/filter.dto';
import { AppealStatus } from './appeal.dto';

export class AppealQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by appeal status',
    enum: ['pending', 'accepted', 'denied'],
  })
  @IsOptional()
  @IsEnum(['pending', 'accepted', 'denied'])
  status?: AppealStatus;

  @ApiPropertyOptional({
    description: 'Filter by player ID',
    type: String,
  })
  @IsOptional()
  playerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by punishment ID',
    type: String,
  })
  @IsOptional()
  punishmentId?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated list of related data to include (e.g., "user")',
    example: 'user',
    type: String,
  })
  @IsOptional()
  @IsString()
  include?: string;

  @ApiPropertyOptional({
    description: 'Order by field and direction',
    type: OrderByDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderByDto)
  orderBy?: OrderByDto;
}
