import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { CommunityPostCommentReactionType } from '../constants/community.constants';
import type { PostCommentWithAuthorProfile } from '../daos/community-post-comment.dao';

export class CommunityPostCommentDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty({ format: 'uuid' })
  postId: string;

  @Expose()
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentCommentId: string | null;

  @Expose()
  @ApiProperty()
  authorUserId: string;

  @Expose()
  @ApiProperty({ example: 'Alex Rivera' })
  authorDisplayName: string;

  @Expose()
  @ApiProperty({ nullable: true })
  authorAvatarUrl: string | null;

  @Expose()
  @ApiProperty({ maxLength: 2000 })
  body: string;

  @Expose()
  @ApiProperty()
  likeCount: number;

  @Expose()
  @ApiProperty()
  dislikeCount: number;

  @Expose()
  @ApiProperty({ enum: ['like', 'dislike'], nullable: true })
  userReaction: CommunityPostCommentReactionType | null;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export function toCommunityPostCommentDto(
  row: PostCommentWithAuthorProfile,
  authorDisplayName: string,
  authorAvatarUrl: string | null,
  reactionCounts: { likeCount: number; dislikeCount: number },
  userReaction: CommunityPostCommentReactionType | null,
): CommunityPostCommentDto {
  return {
    id: row.id,
    postId: row.postId,
    parentCommentId: row.parentCommentId ?? null,
    authorUserId: row.authorUserId,
    authorDisplayName,
    authorAvatarUrl,
    body: row.body,
    likeCount: reactionCounts.likeCount,
    dislikeCount: reactionCounts.dislikeCount,
    userReaction,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
