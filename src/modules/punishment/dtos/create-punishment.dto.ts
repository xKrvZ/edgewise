import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';
import { PunishmentType } from './punishment.dto';
import {
  ManualPunishmentReason,
  MANUAL_PUNISHMENT_REASONS,
} from '../constants/punishment-reason.constants';

export class CreatePunishmentDto {
  @ApiProperty({
    description: 'Type of punishment',
    enum: ['ban', 'mute', 'kick'],
    example: 'ban',
  })
  @IsEnum(['ban', 'mute', 'kick'])
  @IsNotEmpty()
  punishmentType: PunishmentType;

  @ApiProperty({
    description: 'Reasons for the punishment',
    type: [String],
    enum: MANUAL_PUNISHMENT_REASONS,
    example: ['CHEATING', 'CHAT_SPAMMING'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one punishment reason must be provided' })
  @IsEnum(MANUAL_PUNISHMENT_REASONS, { each: true })
  punishmentReasons: ManualPunishmentReason[];

  @ApiPropertyOptional({
    description: 'Note to be created when punishment reason includes "OTHER". Required if punishmentReasons includes "OTHER"',
    example: 'Additional context about the punishment',
  })
  @IsOptional()
  @ValidateIf((o) => o.punishmentReasons?.includes('OTHER'))
  @IsNotEmpty({ message: 'Note is required when punishmentReasons includes "OTHER"' })
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Expiry date of the punishment (ISO 8601)',
    nullable: true,
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiry?: string | null;

  @ApiProperty({
    description: 'Player ID who received the punishment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  playerId: string;

  @ApiPropertyOptional({
    description: 'External ID of the punishment',
    example: 'external-12345',
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({
    description: 'Related abuse report ID',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  relatedAbuseReportId?: string | null;
}
