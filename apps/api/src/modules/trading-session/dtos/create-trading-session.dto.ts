import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class CreateTradingSessionDto {
  @ApiProperty({ example: 'London' })
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: '08:00', description: '24h time HH:mm or HH:mm:ss' })
  @Matches(TIME_REGEX, { message: 'startTime must be a 24h time (HH:mm[:ss])' })
  startTime: string;

  @ApiProperty({ example: '16:30', description: '24h time HH:mm or HH:mm:ss' })
  @Matches(TIME_REGEX, { message: 'endTime must be a 24h time (HH:mm[:ss])' })
  endTime: string;

  @ApiPropertyOptional({ example: 'Europe/London' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}
