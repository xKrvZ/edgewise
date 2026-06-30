import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AdminStatsPeriod } from './admin-stats-query.dto';

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
  @ApiProperty({ example: 128, description: 'All-time registered users (dashboard)' })
  total!: number;

  @ApiPropertyOptional({
    example: 42,
    description: 'New users in the selected analytics period',
  })
  newInPeriod?: number;

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
  @ApiProperty({
    example: 1240,
    description: 'Revenue in the selected analytics period, or unused on dashboard',
  })
  total!: number;

  @ApiPropertyOptional({
    example: 890,
    description: 'Revenue collected since the start of the current calendar month (dashboard)',
  })
  monthToDate?: number;

  @ApiPropertyOptional({
    example: 1218,
    description: 'Estimated monthly recurring revenue from active subscriptions (dashboard)',
  })
  mrr?: number;

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
  @ApiProperty({ example: 42, description: 'Currently active subscriptions (dashboard)' })
  active!: number;

  @ApiProperty({ example: 5, description: 'All-time canceled subscriptions (dashboard)' })
  canceled!: number;

  @ApiPropertyOptional({
    example: 8,
    description: 'Subscriptions activated in the selected analytics period',
  })
  newActive?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Subscriptions canceled in the selected analytics period',
  })
  newCanceled?: number;

  @ApiProperty({ type: AdminStatsGrowthDto })
  growth!: AdminStatsGrowthDto;

  @ApiPropertyOptional({ type: [AdminStatsUserSeriesPointDto] })
  series?: AdminStatsUserSeriesPointDto[];

  @ApiPropertyOptional({
    type: [AdminStatsUserSeriesPointDto],
    description: 'Subscriptions canceled per day (empty â€” cancellation events not tracked in PostHog)',
  })
  cancellationSeries?: AdminStatsUserSeriesPointDto[];

  @ApiPropertyOptional({
    type: [AdminStatsUserSeriesPointDto],
    description: 'Checkout started per day from PostHog checkout_started events',
  })
  checkoutSeries?: AdminStatsUserSeriesPointDto[];
}

export class AdminStatsMetricsSeriesPointDto {
  @ApiProperty({ example: '2026-06-01' })
  date!: string;

  @ApiProperty({ example: 3 })
  signups!: number;

  @ApiProperty({ example: 1 })
  subscriptions!: number;

  @ApiProperty({ example: 0 })
  cancellations!: number;

  @ApiProperty({ example: 12 })
  trades!: number;

  @ApiProperty({ example: 2 })
  journals!: number;

  @ApiProperty({ example: 4 })
  communityJoins!: number;

  @ApiProperty({ example: 87.5 })
  revenue!: number;
}

export class AdminStatsActivationTrendPointDto {
  @ApiProperty({ example: '2026-06-01', description: 'Monday of the week bucket' })
  weekStart!: string;

  @ApiProperty({ example: 14 })
  signups!: number;

  @ApiProperty({ example: 9 })
  journalsCreated!: number;

  @ApiProperty({ example: 6 })
  firstTrades!: number;

  @ApiProperty({ example: 3 })
  communityJoins!: number;

  @ApiProperty({ example: 2 })
  subscriptions!: number;

  @ApiProperty({ example: 64.3, description: 'Journals created as % of signups that week' })
  journalRate!: number;

  @ApiProperty({ example: 42.9, description: 'First trades as % of signups that week' })
  tradeRate!: number;

  @ApiProperty({ example: 21.4, description: 'Community joins as % of signups that week' })
  communityRate!: number;

  @ApiProperty({ example: 14.3, description: 'New subscriptions as % of signups that week' })
  subscriptionRate!: number;
}

export class AdminStatsPeriodComparisonsDto {
  @ApiProperty({ example: 12.5, description: 'Percent change vs the prior period of equal length' })
  users!: number;

  @ApiProperty({ example: 8.0 })
  subscriptions!: number;

  @ApiProperty({ example: -3.2 })
  revenue!: number;

  @ApiProperty({ example: 0 })
  cancellations!: number;

  @ApiPropertyOptional({ example: 15.0 })
  trades?: number;

  @ApiPropertyOptional({ example: 10.5 })
  journals?: number;
}

export class AdminStatsActivationFunnelStepDto {
  @ApiProperty({ example: 'signed_up' })
  key!: string;

  @ApiProperty({ example: 'Signed up' })
  label!: string;

  @ApiProperty({ example: 'Signed up' })
  shortLabel!: string;

  @ApiProperty({ example: 'user_signed_up', description: 'PostHog event name for this step' })
  event!: string;

  @ApiProperty({ example: 128, description: 'Unique users reaching this funnel step' })
  count!: number;
}

export class AdminStatsActivationFunnelDto {
  @ApiProperty({
    enum: ['posthog'],
    example: 'posthog',
    description: 'Analytics funnels are sourced exclusively from PostHog product events',
  })
  source!: 'posthog';

  @ApiProperty({
    type: [AdminStatsActivationFunnelStepDto],
    description: 'Ordered activation funnel steps with counts',
  })
  steps!: AdminStatsActivationFunnelStepDto[];

  @ApiPropertyOptional({
    type: [AdminStatsActivationFunnelStepDto],
    description: 'Period-scoped funnel from PostHog',
  })
  periodSteps?: AdminStatsActivationFunnelStepDto[];
}

export class AdminStatsDto {
  @ApiPropertyOptional({
    enum: ['7d', '30d', '90d'],
    description: 'Selected analytics period (analytics endpoint only)',
  })
  period?: AdminStatsPeriod;

  @ApiProperty({
    example: true,
    description: 'Whether PostHog server credentials are configured for activation funnels',
  })
  posthogConfigured!: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'True when PostHog is configured but the latest funnel query failed',
  })
  posthogFunnelError?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'True when PostHog returned funnel step counts for the selected period',
  })
  posthogFunnelAvailable?: boolean;

  @ApiProperty({ type: AdminStatsUsersDto })
  users!: AdminStatsUsersDto;

  @ApiProperty({ type: AdminStatsRevenueDto })
  revenue!: AdminStatsRevenueDto;

  @ApiProperty({ type: AdminStatsSubscriptionsDto })
  subscriptions!: AdminStatsSubscriptionsDto;

  @ApiProperty({ type: AdminStatsActivationFunnelDto })
  activation!: AdminStatsActivationFunnelDto;

  @ApiPropertyOptional({
    type: [AdminStatsMetricsSeriesPointDto],
    description: 'Daily metrics for the selected analytics period (Postgres)',
  })
  series?: AdminStatsMetricsSeriesPointDto[];

  @ApiPropertyOptional({
    type: [AdminStatsActivationTrendPointDto],
    description: 'Weekly activation conversion rates from PostHog (empty when not configured)',
  })
  activationTrend?: AdminStatsActivationTrendPointDto[];

  @ApiPropertyOptional({
    type: AdminStatsPeriodComparisonsDto,
    description: 'Percent change vs the immediately preceding period of equal length',
  })
  comparisons?: AdminStatsPeriodComparisonsDto;

  @ApiProperty({
    enum: ['rollup', 'polar', 'mock', 'estimate'],
    example: 'mock',
    description:
      'Revenue data source: Postgres rollups, Polar orders API, mock demo series, or subscription-based estimate',
  })
  revenueSource!: 'rollup' | 'polar' | 'mock' | 'estimate';
}

export class AdminDashboardUsersDto {
  @ApiProperty({ example: 128, description: 'All-time registered users' })
  total!: number;
}

export class AdminDashboardSubscriptionsDto {
  @ApiProperty({
    example: 42,
    description: 'Currently active subscriptions',
  })
  active!: number;
}

export class AdminDashboardTradesDto {
  @ApiProperty({
    example: 3842,
    description: 'All-time trades journalled across the platform',
  })
  total!: number;

  @ApiProperty({
    example: 127,
    description: 'Trades journalled since the start of the current calendar month',
  })
  thisMonth!: number;
}

export class AdminDashboardJournalsDto {
  @ApiProperty({
    example: 256,
    description: 'All-time trading accounts (journals) created across the platform',
  })
  total!: number;

  @ApiProperty({
    example: 14,
    description: 'Trading accounts created since the start of the current calendar month',
  })
  thisMonth!: number;
}

export class AdminDashboardCommunitiesDto {
  @ApiProperty({
    example: 18,
    description: 'All-time communities created across the platform',
  })
  total!: number;

  @ApiProperty({
    example: 3,
    description: 'Communities created since the start of the current calendar month',
  })
  thisMonth!: number;
}

export class AdminDashboardPostsDto {
  @ApiProperty({
    example: 412,
    description: 'All-time community posts created across the platform',
  })
  total!: number;

  @ApiProperty({
    example: 28,
    description: 'Community posts created since the start of the current calendar month',
  })
  thisMonth!: number;
}

export class AdminDashboardStatsDto {
  @ApiProperty({ type: AdminDashboardUsersDto })
  users!: AdminDashboardUsersDto;

  @ApiProperty({ type: AdminDashboardSubscriptionsDto })
  subscriptions!: AdminDashboardSubscriptionsDto;

  @ApiProperty({ type: AdminDashboardTradesDto })
  trades!: AdminDashboardTradesDto;

  @ApiProperty({ type: AdminDashboardJournalsDto })
  journals!: AdminDashboardJournalsDto;

  @ApiProperty({ type: AdminDashboardCommunitiesDto })
  communities!: AdminDashboardCommunitiesDto;

  @ApiProperty({ type: AdminDashboardPostsDto })
  posts!: AdminDashboardPostsDto;
}
