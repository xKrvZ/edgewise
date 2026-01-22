import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LiftPunishmentDto {
  @ApiPropertyOptional({
    description: 'Reason why the punishment is being lifted',
    example: 'Appeal accepted',
  })
  @IsOptional()
  @IsString()
  liftReason?: string;
}
