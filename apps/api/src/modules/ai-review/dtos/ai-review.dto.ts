import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AiReviewQueryDto {
  @ApiPropertyOptional({ description: 'Scope the review to a single account' })
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
}

export class AiReviewSetupDto {
  @Expose() @ApiProperty({ example: 'Opening Range Breakout' }) label: string;
  @Expose() @ApiProperty({ example: 1250.5 }) netPnl: number;
  @Expose() @ApiProperty({ example: 0.62, description: 'Win rate (0-1)' }) winRate: number;
}

export class AiReviewDto {
  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  generatedAt: string;

  @Expose()
  @ApiProperty({
    example:
      'Over 50 closed trades you netted $4,820.50 with a 58% win rate and a 1.8 profit factor.',
  })
  summary: string;

  @Expose()
  @ApiProperty({
    example: 'Counter-trend fades are your most costly setup.',
    description: 'The single most impactful weakness identified.',
  })
  biggestWeakness: string;

  @Expose()
  @ApiProperty({ type: AiReviewSetupDto, nullable: true })
  @Type(() => AiReviewSetupDto)
  bestSetup: AiReviewSetupDto | null;

  @Expose()
  @ApiProperty({ type: AiReviewSetupDto, nullable: true })
  @Type(() => AiReviewSetupDto)
  worstSetup: AiReviewSetupDto | null;

  @Expose()
  @ApiProperty({ type: String, isArray: true })
  overtradingWarnings: string[];

  @Expose()
  @ApiProperty({ type: String, isArray: true })
  timeOfDayInsights: string[];

  @Expose()
  @ApiProperty({ type: String, isArray: true })
  ruleBreakingPatterns: string[];

  @Expose()
  @ApiProperty({ type: String, isArray: true })
  suggestedFocus: string[];
}

export class TradeAiReviewDto {
  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  generatedAt: string;

  @Expose()
  @ApiProperty({
    example:
      'Your long ES trade closed for -$125.00 at -0.5R with a 2/5 execution rating.',
  })
  summary: string;

  @Expose()
  @ApiProperty({ type: String, isArray: true })
  insights: string[];

  @Expose()
  @ApiProperty({ type: String, isArray: true })
  mistakesFlagged: string[];

  @Expose()
  @ApiProperty({ type: String, isArray: true })
  suggestions: string[];
}
