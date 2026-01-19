import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderByDto, PaginationDto } from '@/database/dtos/filter.dto';
import { ReportStatus } from './abuse-report.dto';

export class AbuseReportQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by report status',
    enum: ['pending', 'reviewed'],
  })
  @IsOptional()
  @IsEnum(['pending', 'reviewed'])
  status?: ReportStatus;

  @ApiPropertyOptional({
    description: 'Filter by reporting player ID',
    type: String,
  })
  @IsOptional()
  reportingPlayerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by reported player ID',
    type: String,
  })
  @IsOptional()
  reportedPlayerId?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated list of related data to include (e.g., "player")',
    example: 'player',
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
