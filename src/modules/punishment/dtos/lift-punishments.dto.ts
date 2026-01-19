import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsUUID, IsArray } from 'class-validator';

export class LiftPunishmentsDto {
  @ApiPropertyOptional({
    description: 'Single player ID to lift punishments for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @ApiPropertyOptional({
    description: 'Array of player IDs to lift punishments for',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614175000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  playerIds?: string[];

  @ApiProperty({
    description: 'Start date for the date range (ISO 8601)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'End date for the date range (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
