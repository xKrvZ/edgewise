import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PlayerDto {
  @Expose()
  @ApiProperty({
    description: 'Unique identifier for the player',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'External ID of the player',
    example: 'external-12345',
  })
  externalId: string;

  @Expose()
  @ApiProperty({
    description: 'Last known username of the player',
    example: 'PlayerName',
  })
  lastKnownUsername: string;

  @Expose()
  @ApiProperty({
    description: 'Game identifier for the player',
    example: 'hytale',
  })
  game: string;

  @Expose()
  @ApiProperty({
    description: 'Timestamp when the player was created',
    example: '2025-01-17T15:00:00.000Z',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: 'Timestamp when the player was last updated',
    example: '2025-01-17T15:00:00.000Z',
  })
  updatedAt: Date;

  @Expose()
  @ApiProperty({
    description: 'Whether the player has any pending abuse reports',
    example: false,
  })
  hasOpenAbuseReports: boolean;
}
