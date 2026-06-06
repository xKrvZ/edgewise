import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { INVITATION_ROLES, INVITATION_STATUSES } from '../constants/community.constants';
import type { InvitationWithCommunity } from '../daos/community-invitation.dao';

export class CommunityInvitationDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  communityId: string;

  @Expose()
  @ApiProperty()
  communityName: string;

  @Expose()
  @ApiProperty()
  invitedBy: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  inviterName: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  inviteeEmail: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  inviteeUserId: string | null;

  @Expose()
  @ApiProperty({ enum: INVITATION_ROLES })
  role: string;

  @Expose()
  @ApiProperty({ enum: INVITATION_STATUSES })
  status: string;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @Expose()
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  respondedAt: Date | null;
}

export function toInvitationDto(row: InvitationWithCommunity): CommunityInvitationDto {
  return {
    id: row.id,
    communityId: row.communityId,
    communityName: row.communityName,
    invitedBy: row.invitedBy,
    inviterName: row.inviterName,
    inviteeEmail: row.inviteeEmail,
    inviteeUserId: row.inviteeUserId,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt,
    respondedAt: row.respondedAt,
  };
}
