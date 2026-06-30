import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { COMMUNITY_POST_COMMENT_MAX_BODY_LENGTH } from '../constants/community.constants';

export class CreateCommunityPostCommentDto {
  @ApiProperty({ maxLength: COMMUNITY_POST_COMMENT_MAX_BODY_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(COMMUNITY_POST_COMMENT_MAX_BODY_LENGTH)
  body: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Parent comment when replying' })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
