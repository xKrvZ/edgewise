import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, ValidateNested, IsString, IsArray, ArrayMinSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderByDto, PaginationDto } from '@/database/dtos/filter.dto';
import { PunishmentType } from './punishment.dto';
import { PunishmentReason, PUNISHMENT_REASONS } from '../constants/punishment-reason.constants';

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
    description: 'Filter by punishment reason(s). Can be a single reason or comma-separated list of reasons',
    enum: PUNISHMENT_REASONS,
    example: 'CHEATING',
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
  @IsEnum(PUNISHMENT_REASONS, { each: true })
  punishmentReason?: PunishmentReason[];

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
