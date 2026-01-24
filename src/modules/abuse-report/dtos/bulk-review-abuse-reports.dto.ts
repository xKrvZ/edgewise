import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePunishmentDto } from '../../punishment/dtos/create-punishment.dto';

export class BulkReviewAbuseReportsDto {
  @ApiProperty({
    description: 'UUID of the player whose abuse reports should be reviewed',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  playerId: string;

  @ApiProperty({
    description: 'Punishment data. A punishment will be created and linked to all pending abuse reports for this player.',
    type: CreatePunishmentDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreatePunishmentDto)
  punishment: CreatePunishmentDto;
}
