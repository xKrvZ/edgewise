import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PunishmentType } from '../../punishment/dtos/punishment.dto';
import { UserDto } from '@/modules/user/dtos/user.dto';

export type AppealStatus = 'pending' | 'accepted' | 'denied';

export class AppealDto {
  @ApiProperty({
    description: 'Unique identifier for the appeal',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Player ID who submitted the appeal',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  playerId: string;

  @ApiProperty({
    description: 'Punishment ID being appealed',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  punishmentId: string;

  @ApiProperty({
    description: 'Type of punishment being appealed',
    enum: ['ban', 'mute', 'kick'],
    example: 'ban',
  })
  punishmentType: PunishmentType;

  @ApiProperty({
    description: 'Timestamp when the appeal was submitted',
    example: '2025-01-19T18:00:00.000Z',
  })
  submittedAt: string;

  @ApiProperty({
    description: 'Status of the appeal',
    enum: ['pending', 'accepted', 'denied'],
    example: 'pending',
  })
  status: AppealStatus;

  @ApiPropertyOptional({
    description: 'User who reviewed the appeal',
    type: UserDto,
  })
  reviewedBy?: UserDto;
}
