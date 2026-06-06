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
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { createPaginatedSchema } from '@/database/utils/paginated-schema.util';
import { TradeSharingDto } from '@/modules/sharing/dtos/trade-sharing.dto';
import { UpdateTradeSharingDto } from '@/modules/sharing/dtos/update-trade-sharing.dto';
import { SharingService } from '@/modules/sharing/services/sharing.service';
import { TradeService } from '../services/trade.service';
import { TradeDto } from '../dtos/trade.dto';
import { CreateTradeDto } from '../dtos/create-trade.dto';
import { UpdateTradeDto } from '../dtos/update-trade.dto';
import { TradeQueryDto } from '../dtos/trade-query.dto';

@ApiTags('Trades')
@ApiExtraModels(PaginatedDto, TradeDto)
@Controller('trades')
export class TradeController {
  constructor(
    private readonly tradeService: TradeService,
    private readonly sharingService: SharingService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List trades with filters and pagination',
    description:
      'Filterable by symbol, date range, setup/playbook, tag, account, direction and market type.',
  })
  @ApiOkResponse({
    schema: createPaginatedSchema(getSchemaPath(TradeDto)),
  })
  async list(
    @Query() query: TradeQueryDto,
    @Session() session: UserSession,
  ): Promise<PaginatedDto<TradeDto>> {
    return this.tradeService.list(session.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a trade by id' })
  @ApiOkResponse({ type: TradeDto })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<TradeDto> {
    return this.tradeService.getById(id, session.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a trade' })
  @ApiCreatedResponse({ type: TradeDto })
  async create(
    @Body() dto: CreateTradeDto,
    @Session() session: UserSession,
  ): Promise<TradeDto> {
    return this.tradeService.create(session.user.id, dto);
  }

  @Patch(':id/sharing')
  @ApiOperation({ summary: 'Update trade sharing visibility and share token' })
  @ApiOkResponse({ type: TradeSharingDto })
  async updateSharing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTradeSharingDto,
    @Session() session: UserSession,
  ): Promise<TradeSharingDto> {
    return this.sharingService.updateTradeSharing(
      id,
      session.user.id,
      dto.visibility,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a trade' })
  @ApiOkResponse({ type: TradeDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTradeDto,
    @Session() session: UserSession,
  ): Promise<TradeDto> {
    return this.tradeService.update(id, session.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a trade' })
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.tradeService.remove(id, session.user.id);
  }
}
