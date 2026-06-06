import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { CommentTargetType } from '@/modules/comment/constants/comment.constants';
import type { NotificationType } from '../constants/notification.constants';

export class NotificationDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty({ enum: ['comment', 'reply'] })
  type: NotificationType;

  @Expose()
  @ApiProperty()
  actorId: string;

  @Expose()
  @ApiProperty({ example: 'Jordan Lee' })
  actorName: string;

  @Expose()
  @ApiProperty({ format: 'uuid' })
  commentId: string;

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
  @ApiProperty()
  communityName: string;

  @Expose()
  @ApiProperty()
  read: boolean;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class UnreadCountDto {
  @Expose()
  @ApiProperty({ example: 3 })
  count: number;
}
