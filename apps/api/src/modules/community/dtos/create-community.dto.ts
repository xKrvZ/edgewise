import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  COMMUNITY_JOIN_POLICIES,
  COMMUNITY_LEADERBOARD_VISIBILITY,
} from '../constants/community.constants';

export class CreateCommunityDto {
  @ApiProperty({ example: 'Alpha Traders' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'A group for systematic futures traders.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    enum: COMMUNITY_JOIN_POLICIES,
    default: 'invite_only',
    description: 'public: anyone can join; invite_only: invitation required',
  })
  @IsOptional()
  @IsIn(COMMUNITY_JOIN_POLICIES)
  joinPolicy?: (typeof COMMUNITY_JOIN_POLICIES)[number];

  @ApiPropertyOptional({
    enum: COMMUNITY_LEADERBOARD_VISIBILITY,
    default: 'mentors',
    description:
      'public: anyone viewing the community; members: members only; mentors: owner/mentor only',
  })
  @IsOptional()
  @IsIn(COMMUNITY_LEADERBOARD_VISIBILITY)
  leaderboardVisibility?: (typeof COMMUNITY_LEADERBOARD_VISIBILITY)[number];
}
