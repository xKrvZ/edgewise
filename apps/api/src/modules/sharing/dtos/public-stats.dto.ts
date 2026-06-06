import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  AnalyticsOverviewDto,
  EquityPointDto,
} from '@/modules/analytics/dtos/analytics.dto';

export class PublicStatsDto {
  @Expose()
  @ApiProperty({ nullable: true, example: 'Demo Trader' })
  displayName: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  bio: string | null;

  @Expose()
  @ApiProperty({ type: AnalyticsOverviewDto })
  @Type(() => AnalyticsOverviewDto)
  overview: AnalyticsOverviewDto;

  @Expose()
  @ApiProperty({ type: EquityPointDto, isArray: true })
  @Type(() => EquityPointDto)
  equityCurve: EquityPointDto[];
}
