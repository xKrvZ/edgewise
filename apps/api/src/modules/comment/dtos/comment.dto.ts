import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import type { CommentTargetType } from '../constants/comment.constants';

export class CommentDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  authorId: string;

  @Expose()
  @ApiProperty({ example: 'Alex Rivera' })
  authorName: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true, description: 'Resolved author avatar URL' })
  authorImage: string | null;

  @Expose()
  @ApiProperty({ enum: ['trade', 'playbook'] })
  targetType: CommentTargetType;

  @Expose()
  @ApiProperty({ format: 'uuid' })
  targetId: string;

  @Expose()
  @ApiProperty({ format: 'uuid' })
  communityId: string;

  @Expose()
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentId: string | null;

  @Expose()
  @ApiProperty({ maxLength: 2000 })
  body: string;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @Expose()
  @ApiPropertyOptional({ type: () => CommentDto, isArray: true })
  @Type(() => CommentDto)
  replies?: CommentDto[];
}

export class CommentAccessDto {
  @Expose()
  @ApiProperty()
  canView: boolean;

  @Expose()
  @ApiProperty()
  canComment: boolean;

  @Expose()
  @ApiProperty()
  isContentOwner: boolean;

  @Expose()
  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' } },
    },
  })
  communities: Array<{ id: string; name: string }>;
}
