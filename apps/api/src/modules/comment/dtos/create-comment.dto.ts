import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import {
  COMMENT_MAX_BODY_LENGTH,
  COMMENT_TARGET_TYPES,
  type CommentTargetType,
} from '../constants/comment.constants';

export class CreateCommentDto {
  @ApiProperty({ enum: COMMENT_TARGET_TYPES })
  @IsIn(COMMENT_TARGET_TYPES)
  targetType: CommentTargetType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  targetId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  communityId: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ maxLength: COMMENT_MAX_BODY_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(COMMENT_MAX_BODY_LENGTH)
  body: string;
}
