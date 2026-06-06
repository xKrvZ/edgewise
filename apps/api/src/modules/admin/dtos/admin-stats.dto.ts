import { ApiProperty } from '@nestjs/swagger';

export class AdminStatsGrowthDto {
  @ApiProperty({ example: 12.5, description: 'Percent change vs the prior day' })
  daily!: number;

  @ApiProperty({ example: 8.2, description: 'Percent change vs the prior 7 days' })
  weekly!: number;

  @ApiProperty({ example: 15.0, description: 'Percent change vs the prior 30 days' })
  monthly!: number;
}

export class AdminStatsUserSeriesPointDto {
  @ApiProperty({ example: '2026-06-01' })
  date!: string;

  @ApiProperty({ example: 3 })
  count!: number;
}

export class AdminStatsUsersDto {
  @ApiProperty({ example: 128 })
  total!: number;

  @ApiProperty({ example: 2 })
  last24h!: number;

  @ApiProperty({ example: 11 })
  last7d!: number;

  @ApiProperty({ example: 42 })
  last30d!: number;

  @ApiProperty({ type: AdminStatsGrowthDto })
  growth!: AdminStatsGrowthDto;

  @ApiProperty({ type: [AdminStatsUserSeriesPointDto] })
  series!: AdminStatsUserSeriesPointDto[];
}

export class AdminStatsRevenueSeriesPointDto {
  @ApiProperty({ example: '2026-06-01' })
  date!: string;

  @ApiProperty({ example: 87.5 })
  amount!: number;
}

export class AdminStatsRevenueDto {
  @ApiProperty({ example: 1240 })
  total!: number;

  @ApiProperty({ example: 29 })
  last24h!: number;

  @ApiProperty({ example: 203 })
  last7d!: number;

  @ApiProperty({ example: 890 })
  last30d!: number;

  @ApiProperty({ type: AdminStatsGrowthDto })
  growth!: AdminStatsGrowthDto;

  @ApiProperty({ type: [AdminStatsRevenueSeriesPointDto] })
  series!: AdminStatsRevenueSeriesPointDto[];
}

export class AdminStatsSubscriptionsDto {
  @ApiProperty({ example: 42 })
  active!: number;

  @ApiProperty({ example: 5 })
  canceled!: number;

  @ApiProperty({ type: AdminStatsGrowthDto })
  growth!: AdminStatsGrowthDto;
}

export class AdminStatsDto {
  @ApiProperty({ type: AdminStatsUsersDto })
  users!: AdminStatsUsersDto;

  @ApiProperty({ type: AdminStatsRevenueDto })
  revenue!: AdminStatsRevenueDto;

  @ApiProperty({ type: AdminStatsSubscriptionsDto })
  subscriptions!: AdminStatsSubscriptionsDto;

  @ApiProperty({
    enum: ['rollup', 'polar', 'mock', 'estimate'],
    example: 'mock',
    description:
      'Revenue data source: Postgres rollups, Polar orders API, mock demo series, or subscription-based estimate',
  })
  revenueSource!: 'rollup' | 'polar' | 'mock' | 'estimate';
}
