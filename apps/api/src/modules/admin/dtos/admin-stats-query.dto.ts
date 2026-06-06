import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export const ADMIN_STATS_PERIODS = ['7d', '30d', '90d'] as const;
export type AdminStatsPeriod = (typeof ADMIN_STATS_PERIODS)[number];

export class AdminStatsQueryDto {
  @ApiPropertyOptional({
    enum: ADMIN_STATS_PERIODS,
    default: '30d',
    description: 'Chart range for signup and revenue time series',
  })
  @IsOptional()
  @IsIn(ADMIN_STATS_PERIODS)
  period?: AdminStatsPeriod = '30d';
}
