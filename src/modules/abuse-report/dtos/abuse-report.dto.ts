import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlayerDto } from '@/modules/player/dtos/player.dto';

export type ReportStatus = 'pending' | 'reviewed';
export type ActionTaken = 'punishment' | 'no-punishment';

export class AbuseReportDto {
  @ApiProperty({
    description: 'Unique identifier for the abuse report',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Player who reported',
    type: PlayerDto,
  })
  reportingPlayer: Pick<PlayerDto, 'id' | 'lastKnownUsername'>;

  @ApiProperty({
    description: 'Player who was reported',
    type: PlayerDto,
  })
  reportedPlayer: Pick<PlayerDto, 'id' | 'lastKnownUsername'>;

  @ApiProperty({
    description: 'Reason for the report',
    example: 'Harassment',
  })
  reason: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the incident',
    example: 'Player was using offensive language in chat',
  })
  description?: string;

  @ApiProperty({
    description: 'Status of the report',
    enum: ['pending', 'reviewed'],
    example: 'pending',
  })
  status: ReportStatus;

  @ApiPropertyOptional({
    description: 'Action taken on the report',
    enum: ['punishment', 'no-punishment'],
    nullable: true,
  })
  actionTaken: ActionTaken | null;

  @ApiPropertyOptional({
    description: 'Punishment ID if action was taken',
    nullable: true,
  })
  punishmentId: string | null;

  @ApiPropertyOptional({
    description: 'Additional metadata including chat logs',
    example: { chatLogs: ['Message 1', 'Message 2'] },
  })
  metadata?: {
    chatLogs?: string[];
  };

  @ApiProperty({
    description: 'Timestamp when the report was created',
    example: '2025-01-19T18:00:00.000Z',
  })
  createdAt: string;
}
