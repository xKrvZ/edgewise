import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
    summary: 'Get a stored AI review for a single trade',
    description:
      'Returns a previously requested trade review. Does not generate a new review or consume tokens.',
  })
  @ApiOkResponse({ type: TradeAiReviewDto })
  @ApiNotFoundResponse({ description: 'No AI review has been requested for this trade yet' })
  async getTradeReview(
    @Param('tradeId', ParseUUIDPipe) tradeId: string,
    @Session() session: UserSession,
  ): Promise<TradeAiReviewDto> {
    const review = await this.aiReviewService.getStoredTradeReview(session.user.id, tradeId);
    if (!review) {
      throw new NotFoundException('No AI review for this trade yet');
    }
    return review;
  }

  @Post('trades/:tradeId')
  @ApiOperation({
    summary: 'Request an on-demand AI review for a single trade',
    description:
      'Consumes one AI review token (unless on Elite). Generates and stores the review. Returns 402 when out of tokens.',
  })
  @ApiCreatedResponse({ type: TradeAiReviewDto })
  @ApiNotFoundResponse({ description: 'Trade not found' })
  @ApiResponse({ status: 402, description: 'No AI review tokens remaining' })
  async requestTradeReview(
    @Param('tradeId', ParseUUIDPipe) tradeId: string,
    @Session() session: UserSession,
  ): Promise<TradeAiReviewDto> {
    return this.aiReviewService.requestTradeReview(
      session.user.id,
      tradeId,
      session.user.email,
    );
  }
}
