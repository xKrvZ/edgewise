import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PlayerDto } from '@/modules/player/dtos/player.dto';
import { LiftReason, LIFT_REASONS } from '../constants/lift-reason.constants';
import { PunishmentReason, PUNISHMENT_REASONS } from '../constants/punishment-reason.constants';

export type PunishmentType = 'ban' | 'mute' | 'kick';

export class PublicPunishmentDto {
  @Expose()
  @ApiProperty({
    description: 'Unique identifier for the punishment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'Short code ID for the punishment (12 characters)',
    example: 'a1b2c3d4e5f6',
  })
  shortCodeId: string;

  @Expose()
  @ApiProperty({
    description: 'Type of punishment',
    enum: ['ban', 'mute', 'kick'],
    example: 'ban',
  })
  punishmentType: PunishmentType;

  @Expose()
  @ApiProperty({
    description: 'Reasons for the punishment',
    type: [String],
    enum: PUNISHMENT_REASONS,
    example: ['CHEATING', 'CHAT_SPAMMING'],
  })
  punishmentReasons: PunishmentReason[];

  @Expose()
  @ApiPropertyOptional({
    description: 'Expiry date of the punishment',
    nullable: true,
    example: '2025-12-31T23:59:59.000Z',
  })
  expiry: string | null;

  @Expose()
  @ApiProperty({
    description: 'Timestamp when the punishment was created',
    example: '2025-01-19T18:00:00.000Z',
  })
  createdAt: string;

  @Expose()
  @ApiProperty({
    description: 'Whether the punishment has been lifted',
    example: false,
  })
  lifted: boolean;

  @Expose()
  @ApiProperty({
    description: 'Whether appeals are locked for this punishment',
    example: false,
  })
  appealLocked: boolean;

  @Expose()
  @ApiPropertyOptional({
    description: 'Timestamp when the punishment was lifted',
    nullable: true,
    example: '2025-01-20T10:00:00.000Z',
  })
  liftedAt?: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Reason why the punishment was lifted',
    enum: LIFT_REASONS,
    nullable: true,
    example: 'INCONCLUSIVE_EVIDENCE',
  })
  liftReason?: LiftReason | null;

  @Expose()
  @ApiProperty({
    description: 'Player who received the punishment',
    type: PlayerDto,
  })
  player?: Pick<PlayerDto, 'id' | 'lastKnownUsername' | 'externalId' | 'game'>;
}
