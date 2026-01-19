import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SyncPlayerDto {
  @ApiProperty({
    description: 'External ID of the player',
    example: 'external-12345',
  })
  @IsString()
  @IsNotEmpty()
  externalId: string;

  @ApiProperty({
    description: 'Last known username of the player',
    example: 'PlayerName',
  })
  @IsString()
  @IsNotEmpty()
  lastKnownUsername: string;

  @ApiProperty({
    description: 'Game identifier for the player',
    example: 'hytale',
  })
  @IsString()
  @IsNotEmpty()
  game: string;
}
