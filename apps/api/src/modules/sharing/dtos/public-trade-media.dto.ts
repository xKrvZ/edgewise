import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { MEDIA_KINDS, type MediaKind } from '@/modules/storage/constants/storage.constants';

export class PublicTradeMediaDto {
  @Expose() @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @Expose()
  @ApiProperty({ enum: MEDIA_KINDS, example: 'image' })
  kind: MediaKind;

  @Expose()
  @ApiProperty({ example: 'https://storage.example.com/presigned-url' })
  url: string;

  @Expose()
  @ApiProperty({ nullable: true, example: 'Chart for AAPL trade' })
  caption: string | null;

  @Expose()
  @ApiProperty({ nullable: true, example: 'image/png' })
  contentType: string | null;
}
