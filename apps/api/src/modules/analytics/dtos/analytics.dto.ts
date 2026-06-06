import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  MARKET_TYPES,
  TRADE_DIRECTIONS,
  type MarketType,
  type TradeDirection,
} from '@/modules/trade/constants/trade.constants';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Scope analytics to a single account' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: MARKET_TYPES })
  @IsOptional()
  @IsIn(MARKET_TYPES)
  marketType?: MarketType;

  @ApiPropertyOptional({ enum: TRADE_DIRECTIONS })
  @IsOptional()
  @IsIn(TRADE_DIRECTIONS)
  direction?: TradeDirection;
}

export class BestSetupDto {
  @Expose() @ApiProperty({ nullable: true }) playbookId: string | null;
  @Expose() @ApiProperty({ example: 'Opening Range Breakout' }) label: string;
  @Expose() @ApiProperty({ example: 1250.5 }) netPnl: number;
}

export class WorstMistakeDto {
  @Expose() @ApiProperty() mistakeId: string;
  @Expose() @ApiProperty({ example: 'Moved stop loss' }) label: string;
  @Expose() @ApiProperty({ example: 7 }) count: number;
  @Expose() @ApiProperty({ example: -940.25 }) pnlImpact: number;
}

export class TraderScoreBreakdownDto {
  @Expose() @ApiProperty({ example: 60, description: 'Sub-score 0-100' }) winRate: number;
  @Expose() @ApiProperty({ example: 75, description: 'Sub-score 0-100' }) profitFactor: number;
  @Expose() @ApiProperty({ example: 50, description: 'Sub-score 0-100' }) avgWinLoss: number;
  @Expose() @ApiProperty({ example: 80, description: 'Sub-score 0-100' }) recoveryFactor: number;
  @Expose() @ApiProperty({ example: 70, description: 'Sub-score 0-100' }) maxDrawdown: number;
  @Expose() @ApiProperty({ example: 65, description: 'Sub-score 0-100' }) consistency: number;
}

export class AnalyticsOverviewDto {
  @Expose() @ApiProperty({ example: 0 }) netPnl: number;
  @Expose() @ApiProperty({ example: 0 }) grossProfit: number;
  @Expose() @ApiProperty({ example: 0 }) grossLoss: number;
  @Expose()
  @ApiProperty({ example: 0, description: 'Sum of commissions/fees across closed trades' })
  totalFees: number;
  @Expose() @ApiProperty({ example: 0 }) totalTrades: number;
  @Expose() @ApiProperty({ example: 0 }) winningTrades: number;
  @Expose() @ApiProperty({ example: 0 }) losingTrades: number;
  @Expose() @ApiProperty({ example: 0 }) breakevenTrades: number;
  @Expose() @ApiProperty({ example: 0, description: 'Win rate (0-1)' }) winRate: number;
  @Expose() @ApiProperty({ example: 0, nullable: true }) profitFactor: number | null;
  @Expose() @ApiProperty({ example: 0 }) expectancy: number;
  @Expose() @ApiProperty({ example: 0, nullable: true }) avgR: number | null;
  @Expose() @ApiProperty({ example: 0 }) avgWinner: number;
  @Expose() @ApiProperty({ example: 0 }) avgLoser: number;
  @Expose() @ApiProperty({ example: 0 }) largestWin: number;
  @Expose() @ApiProperty({ example: 0 }) largestLoss: number;
  @Expose() @ApiProperty({ example: 0 }) avgHoldMinutes: number;
  @Expose() @ApiProperty({ example: 0, description: 'Avg hold (min) of winners' }) avgWinHoldMinutes: number;
  @Expose() @ApiProperty({ example: 0, description: 'Avg hold (min) of losers' }) avgLossHoldMinutes: number;

  @Expose() @ApiProperty({ example: 1.2, nullable: true, description: 'Annualized P&L-based Sharpe proxy' }) sharpeRatio: number | null;
  @Expose() @ApiProperty({ example: 940.5, description: 'Max peak-to-trough drop (absolute)' }) maxDrawdown: number;
  @Expose() @ApiProperty({ example: 12.5, nullable: true, description: 'Max drawdown as % of peak' }) maxDrawdownPct: number | null;
  @Expose() @ApiProperty({ example: 2.1, nullable: true, description: 'netPnl / maxDrawdown' }) recoveryFactor: number | null;
  @Expose() @ApiProperty({ example: 68, description: 'Composite trader health score 0-100' }) traderScore: number;

  @Expose()
  @ApiProperty({ type: TraderScoreBreakdownDto })
  @Type(() => TraderScoreBreakdownDto)
  traderScoreBreakdown: TraderScoreBreakdownDto;

  @Expose() @ApiProperty({ example: 20, description: 'Distinct trading days' }) tradingDays: number;
  @Expose() @ApiProperty({ example: 12, description: 'Days with net positive P&L' }) profitableDays: number;
  @Expose() @ApiProperty({ example: 0.6, description: 'Profitable-day rate (0-1)' }) greenDayRate: number;

  @Expose()
  @ApiProperty({ type: BestSetupDto, nullable: true })
  @Type(() => BestSetupDto)
  bestSetup: BestSetupDto | null;

  @Expose()
  @ApiProperty({ type: WorstMistakeDto, nullable: true })
  @Type(() => WorstMistakeDto)
  worstMistake: WorstMistakeDto | null;
}

export class EquityPointDto {
  @Expose() @ApiProperty({ type: String, format: 'date', example: '2026-05-12' }) date: string;
  @Expose() @ApiProperty({ example: 320.5 }) pnl: number;
  @Expose() @ApiProperty({ example: 1820.75 }) cumulativePnl: number;
}

export class PnlOverTimePointDto {
  @Expose() @ApiProperty({ type: String, format: 'date', example: '2026-05-12' }) date: string;
  @Expose() @ApiProperty({ example: 320.5 }) pnl: number;
}

export class RDistributionBucketDto {
  @Expose() @ApiProperty({ example: '0..1' }) bucket: string;
  @Expose() @ApiProperty({ example: 12 }) count: number;
}

export class GroupStatDto {
  @Expose() @ApiProperty({ example: 'AAPL' }) key: string;
  @Expose() @ApiProperty({ example: 'AAPL' }) label: string;
  @Expose() @ApiProperty({ example: 0 }) trades: number;
  @Expose() @ApiProperty({ example: 0 }) netPnl: number;
  @Expose() @ApiProperty({ example: 0, description: 'Win rate (0-1)' }) winRate: number;
  @Expose() @ApiProperty({ example: 0, nullable: true }) profitFactor: number | null;
  @Expose() @ApiProperty({ example: 0, nullable: true }) avgR: number | null;
  @Expose() @ApiProperty({ example: 0 }) expectancy: number;
}

export class CalendarDayDto {
  @Expose() @ApiProperty({ type: String, format: 'date', example: '2026-05-12' }) date: string;
  @Expose() @ApiProperty({ example: 320.5 }) pnl: number;
  @Expose() @ApiProperty({ example: 4 }) trades: number;
  @Expose() @ApiProperty({ example: 0.75, description: 'Win rate (0-1)' }) winRate: number;
}

export class DrawdownPointDto {
  @Expose() @ApiProperty({ type: String, format: 'date', example: '2026-05-12' }) date: string;
  @Expose() @ApiProperty({ example: 1820.75, description: 'Cumulative P&L (equity)' }) equity: number;
  @Expose() @ApiProperty({ example: -240.5, description: 'Drop from running peak (<= 0)' }) drawdown: number;
}

export class AccountBalancePointDto {
  @Expose() @ApiProperty({ type: String, format: 'date', example: '2026-05-12' }) date: string;
  @Expose() @ApiProperty({ example: 51820.75, description: 'Starting balance + cumulative P&L' }) balance: number;
}

export class TradeDurationPointDto {
  @Expose() @ApiProperty({ example: 143000, description: 'Hold time in milliseconds' }) durationMs: number;
  @Expose() @ApiProperty({ example: 320.5 }) pnl: number;
  @Expose() @ApiProperty({ example: true, description: 'Whether the trade was a winner' }) win: boolean;
}

/**
 * Consolidated dashboard payload: every widget derived from a single
 * closed-trade fetch, served in one request instead of seven.
 */
export class AnalyticsDashboardDto {
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
  @ApiProperty({ type: AccountBalancePointDto, isArray: true })
  @Type(() => AccountBalancePointDto)
  accountBalance: AccountBalancePointDto[];

  @Expose()
  @ApiProperty({ type: TradeDurationPointDto, isArray: true })
  @Type(() => TradeDurationPointDto)
  tradeDuration: TradeDurationPointDto[];

  @Expose()
  @ApiProperty({ type: CalendarDayDto, isArray: true })
  @Type(() => CalendarDayDto)
  calendar: CalendarDayDto[];
}
