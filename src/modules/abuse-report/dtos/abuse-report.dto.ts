import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PlayerDto } from '@/modules/player/dtos/player.dto';
import { UserDto } from '@/modules/user/dtos/user.dto';
import { ReportReason, REPORT_REASONS } from '../constants/report-reason.constants';

export type ReportStatus = 'pending' | 'reviewed';

export class AbuseReportDto {
  @Expose()
  @ApiProperty({
    description: 'Unique identifier for the abuse report',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'User who reported',
    type: UserDto,
  })
  reporter?: UserDto;

  @Expose()
  @ApiPropertyOptional({
    description: 'User who reviewed the report',
    type: UserDto,
  })
  reviewedBy?: UserDto;

  @Expose()
  @ApiProperty({
    description: 'Player who was reported',
    type: PlayerDto,
  })
  reportedPlayer?: Pick<PlayerDto, 'id' | 'lastKnownUsername' | 'externalId' | 'game'>;

  @Expose()
  @ApiProperty({
    description: 'Reasons for the report',
    type: [String],
    enum: REPORT_REASONS,
    example: ['HARASSMENT_BULLYING_OR_TARGETTED_ABUSE', 'CHAT_SPAMMING'],
  })
  reportReasons: ReportReason[];

  @Expose()
  @ApiPropertyOptional({
    description: 'Detailed description of the incident',
    example: 'Player was using offensive language in chat',
  })
  description?: string;

  @Expose()
  @ApiProperty({
    description: 'Status of the report',
    enum: ['pending', 'reviewed'],
    example: 'pending',
  })
  status: ReportStatus;

  @Expose()
  @ApiPropertyOptional({
    description: 'Punishment ID if action was taken. If null, no punishment was issued.',
    nullable: true,
  })
  punishmentId: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Additional metadata including chat logs',
    example: { chatLogs: ['Message 1', 'Message 2'] },
  })
  metadata?: {
    chatLogs?: string[];
  };

  @Expose()
  @ApiProperty({
    description: 'Timestamp when the report was created',
    example: '2025-01-19T18:00:00.000Z',
  })
  createdAt: string;
}
