import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  COMMUNITY_IMAGE_TYPES,
  MAX_COMMUNITY_POST_CONTENT_IMAGE_BYTES,
  MAX_COMMUNITY_POST_HEADER_BYTES,
} from '../constants/community.constants';

export class CommunityPostHeaderUploadRequestDto {
  @ApiProperty({ example: 'hero.jpg' })
  @IsString()
  @MaxLength(255)
  filename: string;

  @ApiProperty({ enum: COMMUNITY_IMAGE_TYPES, example: 'image/jpeg' })
  @IsString()
  contentType: string;

  @ApiProperty({ example: 512_000, maximum: MAX_COMMUNITY_POST_HEADER_BYTES })
  @IsInt()
  @Min(1)
  @Max(MAX_COMMUNITY_POST_HEADER_BYTES)
  sizeBytes: number;
}

export class CommunityPostContentImageUploadRequestDto {
  @ApiProperty({ example: 'chart.png' })
  @IsString()
  @MaxLength(255)
  filename: string;

  @ApiProperty({ enum: COMMUNITY_IMAGE_TYPES, example: 'image/png' })
  @IsString()
  contentType: string;

  @ApiProperty({ example: 256_000, maximum: MAX_COMMUNITY_POST_CONTENT_IMAGE_BYTES })
  @IsInt()
  @Min(1)
  @Max(MAX_COMMUNITY_POST_CONTENT_IMAGE_BYTES)
  sizeBytes: number;
}

export class CommunityPostContentUploadTargetDto {
  @ApiProperty()
  uploadUrl: string;

  @ApiProperty()
  storageKey: string;

  @ApiProperty({ description: 'Presigned GET URL to preview the image in the editor' })
  downloadUrl: string;

  @ApiProperty()
  expiresIn: number;
}
