import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, ValidateNested, IsString, IsArray, ArrayMinSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderByDto, PaginationDto } from '@/database/dtos/filter.dto';
import { AppealStatus } from './appeal.dto';
import { PunishmentType } from '../../punishment/dtos/punishment.dto';

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
    description: 'Filter by reviewer user ID',
    type: String,
  })
  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @ApiPropertyOptional({
    description: 'Filter by punishment type(s). Can be a single type or comma-separated list of types',
    enum: ['ban', 'mute', 'kick'],
    example: 'ban',
    type: [String],
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value.map((v: any) => (typeof v === 'string' ? v.trim() : v)).filter(Boolean);
    }
    if (typeof value === 'string') {
      return value.split(',').map((v: string) => v.trim()).filter(Boolean);
    }
    return [value];
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(['ban', 'mute', 'kick'], { each: true })
  punishmentType?: PunishmentType[];

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
