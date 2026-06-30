import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import {
  COMMUNITY_POST_CONTENT_MAX_LENGTH,
  COMMUNITY_POST_TITLE_MAX_LENGTH,
  COMMUNITY_POST_VISIBILITY,
  type CommunityPostVisibility,
} from '../constants/community.constants';

export class UpdateCommunityPostDto {
  @ApiPropertyOptional({ example: 'Weekly market recap' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(COMMUNITY_POST_TITLE_MAX_LENGTH)
  title?: string;

  @ApiPropertyOptional({ description: 'Rich-text post body as HTML from the WYSIWYG editor' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(COMMUNITY_POST_CONTENT_MAX_LENGTH)
  content?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'S3 object key for the hero header image; null removes the header',
  })
  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @IsString()
  @MaxLength(512)
  headerStorageKey?: string | null;

  @ApiPropertyOptional({
    enum: COMMUNITY_POST_VISIBILITY,
    description: 'Public posts are visible to anyone; private posts require community membership',
  })
  @IsOptional()
  @IsIn(COMMUNITY_POST_VISIBILITY)
  visibility?: CommunityPostVisibility;

  @ApiPropertyOptional({
    description: 'When false, comments are hidden and cannot be posted',
  })
  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;
}
