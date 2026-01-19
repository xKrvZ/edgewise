import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, ValidateNested, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderByDto, PaginationDto } from '@/database/dtos/filter.dto';
import { PunishmentType } from './punishment.dto';

export class PunishmentQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by punishment type',
    enum: ['ban', 'mute', 'kick'],
  })
  @IsOptional()
  @IsEnum(['ban', 'mute', 'kick'])
  punishmentType?: PunishmentType;

  @ApiPropertyOptional({
    description: 'Filter by lifted status',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  lifted?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by player ID',
    type: String,
  })
  @IsOptional()
  playerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by issued by user ID',
    type: String,
  })
  @IsOptional()
  issuedById?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated list of related data to include (e.g., "player,user")',
    example: 'player,user',
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
