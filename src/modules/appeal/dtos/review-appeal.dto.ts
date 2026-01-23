import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { AppealStatus } from './appeal.dto';
import {
  AppealAcceptanceReason,
  APPEAL_ACCEPTANCE_REASONS,
} from '../constants/appeal-acceptance-reason.constants';
import {
  AppealRejectionReason,
  APPEAL_REJECTION_REASONS,
} from '../constants/appeal-rejection-reason.constants';

export class ReviewAppealDto {
  @ApiProperty({
    description: 'Status of the appeal review',
    enum: ['accepted', 'denied'],
    example: 'accepted',
  })
  @IsEnum(['accepted', 'denied'])
  @IsNotEmpty()
  status: 'accepted' | 'denied';

  @ApiProperty({
    description: 'Reason for accepting the appeal. Required if status is "accepted"',
    enum: APPEAL_ACCEPTANCE_REASONS,
    example: 'INCONCLUSIVE_EVIDENCE',
  })
  @ValidateIf((o) => o.status === 'accepted')
  @IsNotEmpty({ message: 'acceptanceReason is required when status is "accepted"' })
  @IsEnum(APPEAL_ACCEPTANCE_REASONS)
  acceptanceReason?: AppealAcceptanceReason;

  @ApiProperty({
    description: 'Reason for rejecting the appeal. Required if status is "denied"',
    enum: APPEAL_REJECTION_REASONS,
    example: 'STRONG_EVIDENCE',
  })
  @ValidateIf((o) => o.status === 'denied')
  @IsNotEmpty({ message: 'rejectionReason is required when status is "denied"' })
  @IsEnum(APPEAL_REJECTION_REASONS)
  rejectionReason?: AppealRejectionReason;

  @ApiPropertyOptional({
    description: 'Note text explaining the review decision. Required if acceptanceReason or rejectionReason is "OTHER". This note will be attached to the appeal.',
    example: 'Appeal accepted. The punishment has been lifted as the player provided sufficient evidence.',
  })
  @IsOptional()
  @ValidateIf(
    (o) =>
      (o.status === 'accepted' && o.acceptanceReason === 'OTHER') ||
      (o.status === 'denied' && o.rejectionReason === 'OTHER'),
  )
  @IsNotEmpty({
    message: 'Note is required when acceptanceReason or rejectionReason is "OTHER"',
  })
  @ValidateIf((o) => o.note !== undefined && o.note !== null)
  @IsString()
  note?: string;
}
