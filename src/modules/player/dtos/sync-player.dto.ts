import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SyncPlayerDto {
  @ApiProperty({
    description: 'Hytale ID of the player',
    example: 'hytale-12345',
  })
  @IsString()
  @IsNotEmpty()
  hytaleId: string;

  @ApiProperty({
    description: 'Last known username of the player',
    example: 'PlayerName',
  })
  @IsString()
  @IsNotEmpty()
  lastKnownUsername: string;
}
