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
import { TradingSessionService } from '../services/trading-session.service';
import { TradingSessionDto } from '../dtos/trading-session.dto';
import { CreateTradingSessionDto } from '../dtos/create-trading-session.dto';
import { UpdateTradingSessionDto } from '../dtos/update-trading-session.dto';

@ApiTags('Trading Sessions')
@Controller('trading-sessions')
export class TradingSessionController {
  constructor(private readonly tradingSessionService: TradingSessionService) {}

  @Get()
  @ApiOperation({ summary: 'List named market/trading sessions' })
  @ApiOkResponse({ type: TradingSessionDto, isArray: true })
  async list(@Session() session: UserSession): Promise<TradingSessionDto[]> {
    return this.tradingSessionService.list(session.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a trading session by id' })
  @ApiOkResponse({ type: TradingSessionDto })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<TradingSessionDto> {
    return this.tradingSessionService.getById(id, session.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a trading session' })
  @ApiCreatedResponse({ type: TradingSessionDto })
  async create(
    @Body() dto: CreateTradingSessionDto,
    @Session() session: UserSession,
  ): Promise<TradingSessionDto> {
    return this.tradingSessionService.create(session.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a trading session' })
  @ApiOkResponse({ type: TradingSessionDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTradingSessionDto,
    @Session() session: UserSession,
  ): Promise<TradingSessionDto> {
    return this.tradingSessionService.update(id, session.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a trading session' })
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.tradingSessionService.remove(id, session.user.id);
  }
}
