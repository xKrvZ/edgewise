import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';
import { COMMENT_TARGET_TYPES, type CommentTargetType } from '../constants/comment.constants';

export class CommentQueryDto {
  @ApiProperty({ enum: COMMENT_TARGET_TYPES })
  @IsIn(COMMENT_TARGET_TYPES)
  targetType: CommentTargetType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  targetId: string;
}
