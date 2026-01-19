import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportStatus, ActionTaken } from './abuse-report.dto';
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

  @ApiProperty({
    description: 'Action taken on the report',
    enum: ['punishment', 'no-punishment'],
    example: 'punishment',
  })
  @IsEnum(['punishment', 'no-punishment'])
  @IsNotEmpty()
  actionTaken: ActionTaken;

  @ApiPropertyOptional({
    description: 'Punishment data (required if actionTaken is "punishment")',
    type: CreatePunishmentDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePunishmentDto)
  punishment?: CreatePunishmentDto;
}
