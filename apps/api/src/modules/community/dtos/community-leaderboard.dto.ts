import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CommunityLeaderboardEntryDto {
  @Expose()
  @ApiProperty()
  rank: number;

  @Expose()
  @ApiProperty()
  userId: string;

  @Expose()
  @ApiProperty()
  displayName: string;

  @Expose()
  @ApiProperty({ nullable: true, description: 'Resolved trader avatar URL' })
  avatarUrl: string | null;

  @Expose()
  @ApiProperty({ enum: ['owner', 'mentor', 'member'] })
  role: string;

  @Expose()
  @ApiProperty()
  netPnl: number;

  @Expose()
  @ApiProperty()
  winRate: number;

  @Expose()
  @ApiProperty()
  tradeCount: number;

  @Expose()
  @ApiProperty({ nullable: true })
  profitFactor: number | null;
}

export class CommunityLeaderboardDto {
  @Expose()
  @ApiProperty()
  periodDays: number;

  @Expose()
  @ApiProperty({ type: CommunityLeaderboardEntryDto, isArray: true })
  entries: CommunityLeaderboardEntryDto[];
}

export class CommunityStatsDto {
  @Expose()
  @ApiProperty()
  memberCount: number;

  @Expose()
  @ApiProperty({ description: 'Members with at least one closed trade in the period' })
  activeTraders: number;

  @Expose()
  @ApiProperty({ description: 'Aggregate net P&L across all members in the period' })
  aggregateNetPnl: number;

  @Expose()
  @ApiProperty()
  periodDays: number;
}
