import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PublicPlayerDto {
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
}
