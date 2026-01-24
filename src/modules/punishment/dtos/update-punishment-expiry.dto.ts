import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, ValidateIf } from 'class-validator';

export class UpdatePunishmentExpiryDto {
  @ApiPropertyOptional({
    description: 'New expiry date for the punishment (ISO 8601). If null, punishment becomes permanent (admin only).',
    nullable: true,
    example: '2025-12-31T23:59:59.000Z',
  })
  @ValidateIf((o) => o.expiry !== null && o.expiry !== undefined)
  @IsDateString()
  @IsOptional()
  expiry: string | null;
}
