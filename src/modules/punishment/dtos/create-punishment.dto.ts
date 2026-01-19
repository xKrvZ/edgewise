import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { PunishmentType } from './punishment.dto';

export class CreatePunishmentDto {
  @ApiProperty({
    description: 'Type of punishment',
    enum: ['ban', 'mute', 'kick'],
    example: 'ban',
  })
  @IsEnum(['ban', 'mute', 'kick'])
  @IsNotEmpty()
  punishmentType: PunishmentType;

  @ApiPropertyOptional({
    description: 'Type of ban (only for ban punishments)',
    enum: ['permanent', 'temporary'],
    nullable: true,
  })
  @IsOptional()
  @IsEnum(['permanent', 'temporary'])
  banType?: 'permanent' | 'temporary' | null;

  @ApiProperty({
    description: 'Reason for the punishment',
    example: 'Cheating',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

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
