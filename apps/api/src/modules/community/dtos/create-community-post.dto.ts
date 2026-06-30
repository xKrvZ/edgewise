import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import {
  COMMUNITY_POST_CONTENT_MAX_LENGTH,
  COMMUNITY_POST_TITLE_MAX_LENGTH,
  COMMUNITY_POST_VISIBILITY,
  type CommunityPostVisibility,
} from '../constants/community.constants';

export class CreateCommunityPostDto {
  @ApiProperty({ example: 'Weekly market recap' })
  @IsString()
  @MinLength(1)
  @MaxLength(COMMUNITY_POST_TITLE_MAX_LENGTH)
  title: string;

  @ApiProperty({ description: 'Rich-text post body as HTML from the WYSIWYG editor' })
  @IsString()
  @MinLength(1)
  @MaxLength(COMMUNITY_POST_CONTENT_MAX_LENGTH)
  content: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'S3 object key for the hero header image, set after presigned upload',
  })
  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @IsString()
  @MaxLength(512)
  headerStorageKey?: string | null;

  @ApiPropertyOptional({
    enum: COMMUNITY_POST_VISIBILITY,
    default: 'private',
    description: 'Public posts are visible to anyone; private posts require community membership',
  })
  @IsOptional()
  @IsIn(COMMUNITY_POST_VISIBILITY)
  visibility?: CommunityPostVisibility;

  @ApiPropertyOptional({
    default: true,
    description: 'When false, comments are hidden and cannot be posted',
  })
  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;
}
