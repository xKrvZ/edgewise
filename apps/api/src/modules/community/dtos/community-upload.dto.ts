import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  MAX_COMMUNITY_HEADER_BYTES,
  MAX_COMMUNITY_LOGO_BYTES,
  COMMUNITY_IMAGE_TYPES,
} from '../constants/community.constants';

export class CommunityImageUploadRequestDto {
  @ApiProperty({ example: 'logo.png' })
  @IsString()
  @MaxLength(255)
  filename: string;

  @ApiProperty({ enum: COMMUNITY_IMAGE_TYPES, example: 'image/png' })
  @IsString()
  contentType: string;

  @ApiProperty({ example: 102_400 })
  @IsInt()
  @Min(1)
  @Max(MAX_COMMUNITY_HEADER_BYTES)
  sizeBytes: number;
}

export class CommunityLogoUploadRequestDto extends CommunityImageUploadRequestDto {
  @ApiProperty({ example: 102_400, maximum: MAX_COMMUNITY_LOGO_BYTES })
  @IsInt()
  @Min(1)
  @Max(MAX_COMMUNITY_LOGO_BYTES)
  declare sizeBytes: number;
}

export class CommunityHeaderUploadRequestDto extends CommunityImageUploadRequestDto {
  @ApiProperty({ example: 512_000, maximum: MAX_COMMUNITY_HEADER_BYTES })
  @IsInt()
  @Min(1)
  @Max(MAX_COMMUNITY_HEADER_BYTES)
  declare sizeBytes: number;
}

export class CommunityUploadTargetDto {
  @ApiProperty()
  uploadUrl: string;

  @ApiProperty()
  storageKey: string;

  @ApiProperty()
  expiresIn: number;
}
