import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  AnalyticsOverviewDto,
  CalendarDayDto,
  DrawdownPointDto,
  EquityPointDto,
  PnlOverTimePointDto,
  RDistributionBucketDto,
  TradeDurationPointDto,
} from '@/modules/analytics/dtos/analytics.dto';

/**
 * Analytics dashboard computed from backtest_trade rows (no live account balance).
 */
export class BacktestAnalyticsDashboardDto {
  @Expose()
  @ApiProperty({ type: AnalyticsOverviewDto })
  @Type(() => AnalyticsOverviewDto)
  overview: AnalyticsOverviewDto;

  @Expose()
  @ApiProperty({ type: EquityPointDto, isArray: true })
  @Type(() => EquityPointDto)
  equityCurve: EquityPointDto[];

  @Expose()
  @ApiProperty({ type: PnlOverTimePointDto, isArray: true })
  @Type(() => PnlOverTimePointDto)
  pnlOverTime: PnlOverTimePointDto[];

  @Expose()
  @ApiProperty({ type: DrawdownPointDto, isArray: true })
  @Type(() => DrawdownPointDto)
  drawdown: DrawdownPointDto[];

  @Expose()
  @ApiProperty({ type: TradeDurationPointDto, isArray: true })
  @Type(() => TradeDurationPointDto)
  tradeDuration: TradeDurationPointDto[];

  @Expose()
  @ApiProperty({ type: CalendarDayDto, isArray: true })
  @Type(() => CalendarDayDto)
  calendar: CalendarDayDto[];

  @Expose()
  @ApiProperty({ type: RDistributionBucketDto, isArray: true })
  @Type(() => RDistributionBucketDto)
  rDistribution: RDistributionBucketDto[];
}
