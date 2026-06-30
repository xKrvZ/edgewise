import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PublicTradeTraderDto {
  @Expose()
  @ApiProperty({ example: 'Demo Trader' })
  displayName: string;

  @Expose()
  @ApiProperty({
    nullable: true,
    example: 'demo',
    description: 'Account name when it differs from the display name',
  })
  handle: string | null;

  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Presigned avatar URL when an avatar is uploaded',
  })
  avatarUrl: string | null;

  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Presigned header banner URL when a header image is uploaded',
  })
  headerUrl: string | null;

  @Expose()
  @ApiProperty({
    description: 'Whether the trader profile page is publicly discoverable',
  })
  profilePublic: boolean;

  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Opaque profile share token when profilePublic is true',
  })
  profileShareToken: string | null;
}
