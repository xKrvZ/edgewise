import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, ValidateNested, ValidateIf } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ReportStatus } from './abuse-report.dto';
import { CreatePunishmentDto } from '../../punishment/dtos/create-punishment.dto';

export class ReviewAbuseReportDto {
  @ApiProperty({
    description: 'Status of the report review',
    enum: ['reviewed'],
    example: 'reviewed',
  })
  @IsEnum(['reviewed'])
  @IsNotEmpty()
  status: ReportStatus;

  @ApiPropertyOptional({
    description: 'Punishment data (optional). If provided, a punishment will be created and linked to the report.',
    type: CreatePunishmentDto,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Return undefined if value is null, undefined, or empty object
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return undefined;
    }
    return value;
  })
  @ValidateIf((o) => {
    // Only validate if punishment is provided and is an object with at least one property
    return o.punishment !== undefined && 
           o.punishment !== null && 
           typeof o.punishment === 'object' &&
           Object.keys(o.punishment).length > 0;
  })
  @ValidateNested({ each: false })
  @Type(() => CreatePunishmentDto)
  punishment?: CreatePunishmentDto;
}
