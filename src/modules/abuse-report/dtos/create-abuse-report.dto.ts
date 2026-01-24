import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, ArrayMinSize } from 'class-validator';
import { ReportReason, REPORT_REASONS } from '../constants/report-reason.constants';

export class CreateAbuseReportDto {
  @ApiProperty({
    description: 'UUID of the player being reported',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  reportedPlayerId: string;

  @ApiProperty({
    description: 'Reasons for the abuse report',
    type: [String],
    enum: REPORT_REASONS,
    example: ['HARASSMENT_BULLYING_OR_TARGETTED_ABUSE', 'CHAT_SPAMMING'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one report reason must be provided' })
  @IsEnum(REPORT_REASONS, { each: true })
  @IsNotEmpty()
  reportReasons: ReportReason[];

  @ApiPropertyOptional({
    description: 'Detailed description of the incident',
    example: 'Player was using offensive language in chat',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata including chat logs',
    example: { chatLogs: ['Message 1', 'Message 2'] },
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    chatLogs?: string[];
  };
}
