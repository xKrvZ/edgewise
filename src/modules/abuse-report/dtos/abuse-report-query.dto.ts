import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, ValidateNested, IsString, IsArray, ArrayMinSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderByDto, PaginationDto } from '@/database/dtos/filter.dto';
import { ReportStatus } from './abuse-report.dto';
import { ReportReason, REPORT_REASONS } from '../constants/report-reason.constants';

export class AbuseReportQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by report status',
    enum: ['pending', 'reviewed'],
  })
  @IsOptional()
  @IsEnum(['pending', 'reviewed'])
  status?: ReportStatus;

  @ApiPropertyOptional({
    description: 'Filter by reporter user ID',
    type: String,
  })
  @IsOptional()
  @IsString()
  reporter?: string;

  @ApiPropertyOptional({
    description: 'Filter by reported player ID',
    type: String,
  })
  @IsOptional()
  reportedPlayerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by punishment ID',
    type: String,
  })
  @IsOptional()
  @IsString()
  punishmentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by reviewer user ID',
    type: String,
  })
  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @ApiPropertyOptional({
    description: 'Filter by report reason(s). Can be a single reason or comma-separated list of reasons',
    enum: REPORT_REASONS,
    example: 'HARASSMENT_BULLYING_OR_TARGETTED_ABUSE',
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
  @IsEnum(REPORT_REASONS, { each: true })
  reportReason?: ReportReason[];

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
