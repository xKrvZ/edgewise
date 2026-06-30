import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import type { CommunityPostCommentReactionType } from '../constants/community.constants';

export class SetCommunityPostCommentReactionDto {
  @ApiProperty({
    enum: ['like', 'dislike'],
    nullable: true,
    description: 'Reaction type, or null to remove the current reaction',
  })
  @IsOptional()
  @IsIn(['like', 'dislike'])
  type: CommunityPostCommentReactionType | null;
}

export class CommunityPostCommentReactionResultDto {
  @Expose()
  @ApiProperty({ enum: ['like', 'dislike'], nullable: true })
  userReaction: CommunityPostCommentReactionType | null;

  @Expose()
  @ApiProperty()
  likeCount: number;

  @Expose()
  @ApiProperty()
  dislikeCount: number;
}
