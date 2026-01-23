import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ManualLiftReason, MANUAL_LIFT_REASONS } from '../constants/lift-reason.constants';

export class LiftPunishmentDto {
  @ApiPropertyOptional({
    description: 'Reason why the punishment is being lifted',
    enum: MANUAL_LIFT_REASONS,
    example: 'INCONCLUSIVE_EVIDENCE',
  })
  @IsOptional()
  @IsEnum(MANUAL_LIFT_REASONS)
  liftReason?: ManualLiftReason;

  @ApiPropertyOptional({
    description: 'Note to be created when lifting the punishment. Required if liftReason is "OTHER"',
    example: 'Insufficient evidence to support the original punishment',
  })
  @ValidateIf((o) => o.liftReason === 'OTHER')
  @IsNotEmpty({ message: 'Note is required when liftReason is "OTHER"' })
  @ValidateIf((o) => o.note !== undefined && o.note !== null)
  @IsString()
  note?: string;
}
