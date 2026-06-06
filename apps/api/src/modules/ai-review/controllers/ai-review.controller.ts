import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { AiReviewService } from '../services/ai-review.service';
import {
  AiReviewDto,
  AiReviewQueryDto,
  TradeAiReviewDto,
} from '../dtos/ai-review.dto';

@ApiTags('AI Review')
@Controller('ai-review')
export class AiReviewController {
  constructor(private readonly aiReviewService: AiReviewService) {}

  @Get()
  @ApiOperation({
    summary: 'Generate an AI-style performance review for a date range',
    description:
      'Returns a structured review (weaknesses, best/worst setups, overtrading, time-of-day insights, rule-breaking patterns, suggested focus). Currently backed by a deterministic mock provider.',
  })
  @ApiOkResponse({ type: AiReviewDto })
  async generate(
    @Query() query: AiReviewQueryDto,
    @Session() session: UserSession,
  ): Promise<AiReviewDto> {
    return this.aiReviewService.generateReview(session.user.id, query);
  }

  @Get('trades/:tradeId')
  @ApiOperation({
    summary: 'Generate an AI-style review for a single trade',
    description:
      'Returns trade-specific insights, flagged mistakes, and actionable suggestions. Currently backed by a deterministic mock provider.',
  })
  @ApiOkResponse({ type: TradeAiReviewDto })
  async generateForTrade(
    @Param('tradeId', ParseUUIDPipe) tradeId: string,
    @Session() session: UserSession,
  ): Promise<TradeAiReviewDto> {
    return this.aiReviewService.generateTradeReview(session.user.id, tradeId);
  }
}
