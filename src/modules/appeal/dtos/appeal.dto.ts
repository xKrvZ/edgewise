import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PunishmentType } from '../../punishment/dtos/punishment.dto';
import { UserDto } from '@/modules/user/dtos/user.dto';
import { NoteDto } from '@/modules/note/dtos/note.dto';
import { AppealAcceptanceReason } from '../constants/appeal-acceptance-reason.constants';
import { AppealRejectionReason } from '../constants/appeal-rejection-reason.constants';

export type AppealStatus = 'pending' | 'accepted' | 'denied';

export class AppealDto {
  @Expose()
  @ApiProperty({
    description: 'Unique identifier for the appeal',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'Player ID who submitted the appeal',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  playerId: string;

  @Expose()
  @ApiProperty({
    description: 'Punishment ID being appealed',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  punishmentId: string;

  @Expose()
  @ApiProperty({
    description: 'Type of punishment being appealed',
    enum: ['ban', 'mute', 'kick'],
    example: 'ban',
  })
  punishmentType: PunishmentType;

  @Expose()
  @ApiProperty({
    description: 'Timestamp when the appeal was submitted',
    example: '2025-01-19T18:00:00.000Z',
  })
  submittedAt: string;

  @Expose()
  @ApiProperty({
    description: 'Status of the appeal',
    enum: ['pending', 'accepted', 'denied'],
    example: 'pending',
  })
  status: AppealStatus;

  @Expose()
  @ApiPropertyOptional({
    description: 'Description/reason provided by the player when submitting the appeal',
    example: 'I believe this punishment was issued in error. I was not online at the time of the incident.',
  })
  description?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'User who reviewed the appeal',
    type: UserDto,
  })
  reviewedBy?: UserDto;

  @Expose()
  @ApiPropertyOptional({
    description: 'Note created when reviewing the appeal',
    type: NoteDto,
  })
  reviewNote?: NoteDto;

  @Expose()
  @ApiPropertyOptional({
    description: 'Reason for accepting the appeal',
    enum: [
      'INCONCLUSIVE_EVIDENCE',
      'PROVIDES_PROOF_THAT_CONTRADICTS_PUNISHMENT',
      'ISSUED_IN_ERROR',
      'ISSUED_EXCESSIVELY',
      'ACKNOWLEDGED_AND_REFORMED',
      'MISIDENTIFICATION',
      'FALSE_POSITIVE',
      'OTHER',
    ],
    nullable: true,
    example: 'INCONCLUSIVE_EVIDENCE',
  })
  acceptanceReason?: AppealAcceptanceReason | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Reason for rejecting the appeal',
    enum: [
      'STRONG_EVIDENCE',
      'PLAYER_ADMITS_GUILT',
      'REPEAT_OFFENSE',
      'LYING_HOSTILE_OR_RUDE',
      'FAILURE_TO_RECOGNISE_ACCOUNTABILITY',
      'LOW_EFFORT_APPEAL',
      'OTHER',
    ],
    nullable: true,
    example: 'STRONG_EVIDENCE',
  })
  rejectionReason?: AppealRejectionReason | null;
}
