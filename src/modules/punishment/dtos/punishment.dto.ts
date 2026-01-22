import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PlayerDto } from '@/modules/player/dtos/player.dto';
import { UserDto } from '@/modules/user/dtos/user.dto';

export type PunishmentType = 'ban' | 'mute' | 'kick';

export class PunishmentDto {
  @Expose()
  @ApiProperty({
    description: 'Unique identifier for the punishment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'Type of punishment',
    enum: ['ban', 'mute', 'kick'],
    example: 'ban',
  })
  punishmentType: PunishmentType;

  @Expose()
  @ApiPropertyOptional({
    description: 'Type of ban (only for ban punishments)',
    enum: ['permanent', 'temporary'],
    nullable: true,
  })
  banType?: 'permanent' | 'temporary' | null;

  @Expose()
  @ApiProperty({
    description: 'Reason for the punishment',
    example: 'Cheating',
  })
  reason: string;

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
    description: 'Player who received the punishment',
    type: PlayerDto,
  })
  player?: Pick<PlayerDto, 'id' | 'lastKnownUsername' | 'externalId'>;

  @Expose()
  @ApiPropertyOptional({
    description: 'User who issued the punishment',
    type: UserDto,
  })
  issuedBy?: UserDto;

  @Expose()
  @ApiProperty({
    description: 'Whether the punishment has been lifted',
    example: false,
  })
  lifted: boolean;

  @Expose()
  @ApiPropertyOptional({
    description: 'User who lifted the punishment',
    type: UserDto,
  })
  liftedBy?: UserDto;

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
    nullable: true,
    example: 'Appeal accepted',
  })
  liftReason?: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Related abuse report ID',
    nullable: true,
  })
  relatedAbuseReportId?: string | null;
}
