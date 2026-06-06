import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { COMMENT_MAX_BODY_LENGTH } from '../constants/comment.constants';

export class UpdateCommentDto {
  @ApiProperty({ maxLength: COMMENT_MAX_BODY_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(COMMENT_MAX_BODY_LENGTH)
  body: string;
}
