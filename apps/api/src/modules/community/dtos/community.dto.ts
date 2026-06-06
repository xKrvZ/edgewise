import type { Community } from '@/database/types/db';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { Selectable } from 'kysely';
import { COMMUNITY_MEMBER_ROLES } from '../constants/community.constants';

export class CommunitySummaryDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @Expose()
  @ApiProperty()
  createdBy: string;

  @Expose()
  @ApiProperty()
  memberCount: number;

  @Expose()
  @ApiProperty({ enum: COMMUNITY_MEMBER_ROLES })
  myRole: string;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export function toCommunitySummaryDto(
  row: Selectable<Community> & { memberRole: string; memberCount: number },
): CommunitySummaryDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdBy: row.createdBy,
    memberCount: row.memberCount,
    myRole: row.memberRole,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class CommunityMemberDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  userId: string;

  @Expose()
  @ApiProperty()
  displayName: string;

  @Expose()
  @ApiProperty({ nullable: true, description: 'Resolved member avatar URL' })
  avatarUrl: string | null;

  @Expose()
  @ApiProperty({ enum: COMMUNITY_MEMBER_ROLES })
  role: string;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  joinedAt: Date;
}

export class CommunityDetailDto extends CommunitySummaryDto {
  @Expose()
  @ApiPropertyOptional({ type: CommunityMemberDto, isArray: true })
  members?: CommunityMemberDto[];
}

export function toCommunityDetailDto(
  row: Selectable<Community>,
  memberCount: number,
  myRole: string,
  members?: CommunityMemberDto[],
): CommunityDetailDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdBy: row.createdBy,
    memberCount,
    myRole,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    members,
  };
}
