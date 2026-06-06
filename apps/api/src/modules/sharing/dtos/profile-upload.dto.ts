import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  MAX_AVATAR_BYTES,
  MAX_HEADER_BYTES,
  PROFILE_IMAGE_TYPES,
} from '../constants/sharing.constants';

export class ProfileImageUploadRequestDto {
  @ApiProperty({ example: 'avatar.png' })
  @IsString()
  @MaxLength(255)
  filename: string;

  @ApiProperty({ enum: PROFILE_IMAGE_TYPES, example: 'image/png' })
  @IsString()
  contentType: string;

  @ApiProperty({ example: 102_400 })
  @IsInt()
  @Min(1)
  @Max(MAX_HEADER_BYTES)
  sizeBytes: number;
}

export class ProfileAvatarUploadRequestDto extends ProfileImageUploadRequestDto {
  @ApiProperty({ example: 102_400, maximum: MAX_AVATAR_BYTES })
  @IsInt()
  @Min(1)
  @Max(MAX_AVATAR_BYTES)
  declare sizeBytes: number;
}

export class ProfileHeaderUploadRequestDto extends ProfileImageUploadRequestDto {
  @ApiProperty({ example: 512_000, maximum: MAX_HEADER_BYTES })
  @IsInt()
  @Min(1)
  @Max(MAX_HEADER_BYTES)
  declare sizeBytes: number;
}

export class ProfileUploadTargetDto {
  @ApiProperty()
  uploadUrl: string;

  @ApiProperty()
  storageKey: string;

  @ApiProperty()
  expiresIn: number;
}
