import type { Community } from '@/database/types/db';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { Selectable } from 'kysely';
import {
  COMMUNITY_JOIN_POLICIES,
  COMMUNITY_LEADERBOARD_VISIBILITY,
  COMMUNITY_MEMBER_ROLES,
  type CommunityLeaderboardVisibility,
} from '../constants/community.constants';
import { CommunityTagDto } from './community-tag.dto';

export class CommunityPendingInvitationDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty({ enum: COMMUNITY_MEMBER_ROLES })
  role: string;
}

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
  @ApiProperty({ enum: COMMUNITY_MEMBER_ROLES, nullable: true })
  myRole: string | null;

  @Expose()
  @ApiProperty({ enum: COMMUNITY_JOIN_POLICIES })
  joinPolicy: string;

  @Expose()
  @ApiProperty({ description: 'Featured on discover when true' })
  featured: boolean;

  @Expose()
  @ApiProperty({ enum: COMMUNITY_LEADERBOARD_VISIBILITY })
  leaderboardVisibility: CommunityLeaderboardVisibility;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @Expose()
  @ApiPropertyOptional({ nullable: true, description: 'Presigned logo URL' })
  logoUrl?: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, description: 'Presigned header banner URL' })
  headerUrl?: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: 'https://example.com' })
  websiteUrl?: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: 'https://discord.gg/abc123' })
  discordUrl?: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: 'https://instagram.com/yourcommunity' })
  instagramUrl?: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: 'https://tiktok.com/@yourcommunity' })
  tiktokUrl?: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: 'https://youtube.com/@yourcommunity' })
  youtubeUrl?: string | null;

  @Expose()
  @ApiPropertyOptional({
    nullable: true,
    description: 'Our Community about page content',
  })
  aboutContent?: string | null;

  @Expose()
  @ApiPropertyOptional({
    type: CommunityPendingInvitationDto,
    nullable: true,
    description: 'Pending invitation for the current user, if any',
  })
  pendingInvitation?: CommunityPendingInvitationDto | null;
}

export function toCommunitySummaryDto(
  row: Selectable<Community> & { memberRole: string | null; memberCount: number },
  imageUrls?: { logoUrl: string | null; headerUrl: string | null },
  pendingInvitation?: CommunityPendingInvitationDto | null,
): CommunitySummaryDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdBy: row.createdBy,
    memberCount: row.memberCount,
    myRole: row.memberRole,
    joinPolicy: row.joinPolicy,
    featured: Boolean(row.featured),
    leaderboardVisibility: (row.leaderboardVisibility ??
      'mentors') as CommunityLeaderboardVisibility,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    logoUrl: imageUrls?.logoUrl ?? null,
    headerUrl: imageUrls?.headerUrl ?? null,
    websiteUrl: row.websiteUrl ?? null,
    discordUrl: row.discordUrl ?? null,
    instagramUrl: row.instagramUrl ?? null,
    tiktokUrl: row.tiktokUrl ?? null,
    youtubeUrl: row.youtubeUrl ?? null,
    aboutContent: row.aboutContent ?? null,
    pendingInvitation: pendingInvitation ?? null,
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
  @ApiProperty({ nullable: true, description: 'Resolved member header banner URL' })
  headerUrl: string | null;

  @Expose()
  @ApiProperty({ enum: COMMUNITY_MEMBER_ROLES })
  role: string;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  joinedAt: Date;
}

export class CommunityMemberWithTagsDto extends CommunityMemberDto {
  @Expose()
  @ApiProperty({ type: CommunityTagDto, isArray: true })
  tags: CommunityTagDto[];
}

export class CommunityDetailDto extends CommunitySummaryDto {
  @Expose()
  @ApiPropertyOptional({ type: CommunityMemberWithTagsDto, isArray: true })
  members?: CommunityMemberWithTagsDto[];
}

export function toCommunityDetailDto(
  row: Selectable<Community>,
  memberCount: number,
  myRole: string | null,
  members?: CommunityMemberWithTagsDto[],
  imageUrls?: { logoUrl: string | null; headerUrl: string | null },
  pendingInvitation?: CommunityPendingInvitationDto | null,
): CommunityDetailDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdBy: row.createdBy,
    memberCount,
    myRole,
    joinPolicy: row.joinPolicy,
    featured: Boolean(row.featured),
    leaderboardVisibility: (row.leaderboardVisibility ??
      'mentors') as CommunityLeaderboardVisibility,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    logoUrl: imageUrls?.logoUrl ?? null,
    headerUrl: imageUrls?.headerUrl ?? null,
    websiteUrl: row.websiteUrl ?? null,
    discordUrl: row.discordUrl ?? null,
    instagramUrl: row.instagramUrl ?? null,
    tiktokUrl: row.tiktokUrl ?? null,
    youtubeUrl: row.youtubeUrl ?? null,
    aboutContent: row.aboutContent ?? null,
    members,
    pendingInvitation: pendingInvitation ?? null,
  };
}
