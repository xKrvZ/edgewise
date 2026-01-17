import { ApiProperty } from '@nestjs/swagger';

export class PlayerDto {
  @ApiProperty({
    description: 'Unique identifier for the player',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Hytale ID of the player',
    example: 'hytale-12345',
  })
  hytaleId: string;

  @ApiProperty({
    description: 'Last known username of the player',
    example: 'PlayerName',
  })
  lastKnownUsername: string;

  @ApiProperty({
    description: 'Timestamp when the player was created',
    example: '2025-01-17T15:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the player was last updated',
    example: '2025-01-17T15:00:00.000Z',
  })
  updatedAt: Date;
}
