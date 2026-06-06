import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { AnalyticsService } from '../services/analytics.service';
import {
  AccountBalancePointDto,
  AnalyticsDashboardDto,
  AnalyticsOverviewDto,
  AnalyticsQueryDto,
  CalendarDayDto,
  DrawdownPointDto,
  EquityPointDto,
  GroupStatDto,
  PnlOverTimePointDto,
  RDistributionBucketDto,
  TradeDurationPointDto,
} from '../dtos/analytics.dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Consolidated dashboard payload (single fetch, cached)',
  })
  @ApiOkResponse({ type: AnalyticsDashboardDto })
  async dashboard(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<AnalyticsDashboardDto> {
    return this.analyticsService.getDashboard(session.user.id, query);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Aggregate performance overview metrics' })
  @ApiOkResponse({ type: AnalyticsOverviewDto })
  async overview(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<AnalyticsOverviewDto> {
    return this.analyticsService.getOverview(session.user.id, query);
  }

  @Get('equity-curve')
  @ApiOperation({ summary: 'Cumulative equity curve points (daily)' })
  @ApiOkResponse({ type: EquityPointDto, isArray: true })
  async equityCurve(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<EquityPointDto[]> {
    return this.analyticsService.getEquityCurve(session.user.id, query);
  }

  @Get('pnl-over-time')
  @ApiOperation({ summary: 'Daily net P&L over time' })
  @ApiOkResponse({ type: PnlOverTimePointDto, isArray: true })
  async pnlOverTime(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<PnlOverTimePointDto[]> {
    return this.analyticsService.getPnlOverTime(session.user.id, query);
  }

  @Get('r-distribution')
  @ApiOperation({ summary: 'Distribution of trades across R-multiple buckets' })
  @ApiOkResponse({ type: RDistributionBucketDto, isArray: true })
  async rDistribution(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<RDistributionBucketDto[]> {
    return this.analyticsService.getRDistribution(session.user.id, query);
  }

  @Get('by-setup')
  @ApiOperation({ summary: 'Performance grouped by setup/playbook' })
  @ApiOkResponse({ type: GroupStatDto, isArray: true })
  async bySetup(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<GroupStatDto[]> {
    return this.analyticsService.getBySetup(session.user.id, query);
  }

  @Get('by-symbol')
  @ApiOperation({ summary: 'Performance grouped by symbol' })
  @ApiOkResponse({ type: GroupStatDto, isArray: true })
  async bySymbol(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<GroupStatDto[]> {
    return this.analyticsService.getBySymbol(session.user.id, query);
  }

  @Get('by-day-of-week')
  @ApiOperation({ summary: 'Performance grouped by day of week (Mon..Sun)' })
  @ApiOkResponse({ type: GroupStatDto, isArray: true })
  async byDayOfWeek(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<GroupStatDto[]> {
    return this.analyticsService.getByDayOfWeek(session.user.id, query);
  }

  @Get('by-time-of-day')
  @ApiOperation({ summary: 'Performance grouped by hour of day' })
  @ApiOkResponse({ type: GroupStatDto, isArray: true })
  async byTimeOfDay(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<GroupStatDto[]> {
    return this.analyticsService.getByTimeOfDay(session.user.id, query);
  }

  @Get('by-mistake')
  @ApiOperation({ summary: 'Performance grouped by tagged mistake' })
  @ApiOkResponse({ type: GroupStatDto, isArray: true })
  async byMistake(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<GroupStatDto[]> {
    return this.analyticsService.getByMistake(session.user.id, query);
  }

  @Get('by-session')
  @ApiOperation({ summary: 'Performance grouped by trading session' })
  @ApiOkResponse({ type: GroupStatDto, isArray: true })
  async bySession(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<GroupStatDto[]> {
    return this.analyticsService.getBySession(session.user.id, query);
  }

  @Get('by-account')
  @ApiOperation({ summary: 'Performance grouped by trading account' })
  @ApiOkResponse({ type: GroupStatDto, isArray: true })
  async byAccount(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<GroupStatDto[]> {
    return this.analyticsService.getByAccount(session.user.id, query);
  }

  @Get('by-direction')
  @ApiOperation({ summary: 'Performance grouped by direction (long vs short)' })
  @ApiOkResponse({ type: GroupStatDto, isArray: true })
  async byDirection(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<GroupStatDto[]> {
    return this.analyticsService.getByDirection(session.user.id, query);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Daily P&L calendar buckets (for heatmap)' })
  @ApiOkResponse({ type: CalendarDayDto, isArray: true })
  async calendar(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<CalendarDayDto[]> {
    return this.analyticsService.getCalendar(session.user.id, query);
  }

  @Get('drawdown')
  @ApiOperation({ summary: 'Daily equity + drawdown curve' })
  @ApiOkResponse({ type: DrawdownPointDto, isArray: true })
  async drawdown(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<DrawdownPointDto[]> {
    return this.analyticsService.getDrawdown(session.user.id, query);
  }

  @Get('account-balance')
  @ApiOperation({ summary: 'Account balance over time (starting balance + cumulative P&L)' })
  @ApiOkResponse({ type: AccountBalancePointDto, isArray: true })
  async accountBalance(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<AccountBalancePointDto[]> {
    return this.analyticsService.getAccountBalance(session.user.id, query);
  }

  @Get('trade-duration')
  @ApiOperation({ summary: 'Per-trade hold duration vs P&L (scatter)' })
  @ApiOkResponse({ type: TradeDurationPointDto, isArray: true })
  async tradeDuration(
    @Query() query: AnalyticsQueryDto,
    @Session() session: UserSession,
  ): Promise<TradeDurationPointDto[]> {
    return this.analyticsService.getTradeDuration(session.user.id, query);
  }
}
