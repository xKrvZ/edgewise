import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  COMMUNITY_JOIN_POLICIES,
  COMMUNITY_LEADERBOARD_VISIBILITY,
} from '../constants/community.constants';

export class UpdateCommunityDto {
  @ApiPropertyOptional({ example: 'Alpha Traders' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    enum: COMMUNITY_JOIN_POLICIES,
    description: 'public: anyone can join; invite_only: invitation required',
  })
  @IsOptional()
  @IsIn(COMMUNITY_JOIN_POLICIES)
  joinPolicy?: (typeof COMMUNITY_JOIN_POLICIES)[number];

  @ApiPropertyOptional({
    enum: COMMUNITY_LEADERBOARD_VISIBILITY,
    description:
      'public: anyone viewing the community; members: members only; mentors: owner/mentor only',
  })
  @IsOptional()
  @IsIn(COMMUNITY_LEADERBOARD_VISIBILITY)
  leaderboardVisibility?: (typeof COMMUNITY_LEADERBOARD_VISIBILITY)[number];

  @ApiPropertyOptional({
    example: 'Welcome to our trading community! We focus on disciplined review and mentorship.',
    nullable: true,
    description: 'Our Community about page content; null or empty clears the page',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  aboutContent?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com',
    nullable: true,
    description: 'Community website URL; null or empty clears the link',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  websiteUrl?: string | null;

  @ApiPropertyOptional({
    example: 'https://discord.gg/abc123',
    nullable: true,
    description: 'Discord invite URL; null or empty clears the link',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  discordUrl?: string | null;

  @ApiPropertyOptional({
    example: 'https://instagram.com/yourcommunity',
    nullable: true,
    description: 'Instagram profile URL; null or empty clears the link',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  instagramUrl?: string | null;

  @ApiPropertyOptional({
    example: 'https://tiktok.com/@yourcommunity',
    nullable: true,
    description: 'TikTok profile URL; null or empty clears the link',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  tiktokUrl?: string | null;

  @ApiPropertyOptional({
    example: 'https://youtube.com/@yourcommunity',
    nullable: true,
    description: 'YouTube channel URL; null or empty clears the link',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  youtubeUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Set after uploading logo via presigned URL; null removes logo',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  logoStorageKey?: string | null;

  @ApiPropertyOptional({
    description: 'Set after uploading header via presigned URL; null removes header',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  headerStorageKey?: string | null;
}
