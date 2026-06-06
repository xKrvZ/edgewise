import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { BacktestAnalyticsService } from '../services/backtest-analytics.service';
import { BacktestService } from '../services/backtest.service';
import { BacktestAnalyticsDashboardDto } from '../dtos/backtest-analytics.dto';
import {
  BacktestDto,
  CreateBacktestDto,
  UpdateBacktestDto,
} from '../dtos/backtest.dto';
import {
  BacktestTradeDto,
  CreateBacktestTradeDto,
} from '../dtos/backtest-trade.dto';

@ApiTags('Backtests')
@Controller('backtests')
export class BacktestController {
  constructor(
    private readonly backtestService: BacktestService,
    private readonly backtestAnalyticsService: BacktestAnalyticsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List backtests' })
  @ApiOkResponse({ type: BacktestDto, isArray: true })
  async list(@Session() session: UserSession): Promise<BacktestDto[]> {
    return this.backtestService.list(session.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a backtest by id' })
  @ApiOkResponse({ type: BacktestDto })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<BacktestDto> {
    return this.backtestService.getById(id, session.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a backtest' })
  @ApiCreatedResponse({ type: BacktestDto })
  async create(
    @Body() dto: CreateBacktestDto,
    @Session() session: UserSession,
  ): Promise<BacktestDto> {
    return this.backtestService.create(session.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a backtest' })
  @ApiOkResponse({ type: BacktestDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBacktestDto,
    @Session() session: UserSession,
  ): Promise<BacktestDto> {
    return this.backtestService.update(id, session.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a backtest' })
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.backtestService.remove(id, session.user.id);
  }

  // ==================== Backtest analytics ====================

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Analytics dashboard for a backtest' })
  @ApiOkResponse({ type: BacktestAnalyticsDashboardDto })
  async getAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<BacktestAnalyticsDashboardDto> {
    return this.backtestAnalyticsService.getDashboard(id, session.user.id);
  }

  // ==================== Backtest trades ====================

  @Get(':id/trades')
  @ApiOperation({ summary: 'List trades for a backtest' })
  @ApiOkResponse({ type: BacktestTradeDto, isArray: true })
  async listTrades(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<BacktestTradeDto[]> {
    return this.backtestService.listTrades(id, session.user.id);
  }

  @Post(':id/trades')
  @ApiOperation({ summary: 'Add a trade to a backtest' })
  @ApiCreatedResponse({ type: BacktestTradeDto })
  async addTrade(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateBacktestTradeDto,
    @Session() session: UserSession,
  ): Promise<BacktestTradeDto> {
    return this.backtestService.addTrade(id, session.user.id, dto);
  }

  @Delete(':id/trades/:tradeId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a backtest trade' })
  @ApiNoContentResponse()
  async removeTrade(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tradeId', ParseUUIDPipe) tradeId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.backtestService.removeTrade(id, tradeId, session.user.id);
  }
}
