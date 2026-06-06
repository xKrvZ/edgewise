import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import {
  INTERVAL_MS,
  MAX_CANDLES,
} from '@/modules/market-data/constants/market-data.constants';
import { MarketDataConfigResponseDto } from '@/modules/market-data/dtos/market-data-config-response.dto';
import { MarketDataHistoryQueryDto } from '@/modules/market-data/dtos/market-data-history-query.dto';
import {
  MarketDataHistoryErrorDto,
  MarketDataHistoryNoDataDto,
  MarketDataHistoryOkDto,
} from '@/modules/market-data/dtos/market-data-history-response.dto';
import { MarketDataService } from '@/modules/market-data/services/market-data.service';
import {
  parseResolution,
  SUPPORTED_TV_RESOLUTIONS,
} from '@/modules/market-data/utils/resolution.util';

type HistoryResponse =
  | MarketDataHistoryOkDto
  | MarketDataHistoryNoDataDto
  | MarketDataHistoryErrorDto;

@ApiTags('Market Data')
@ApiExtraModels(
  MarketDataHistoryOkDto,
  MarketDataHistoryNoDataDto,
  MarketDataHistoryErrorDto,
  MarketDataConfigResponseDto,
)
@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('config')
  @ApiOperation({
    summary: 'TradingView UDF datafeed config',
    description:
      'Returns supported resolutions and feature flags for the Charting Library datafeed.',
  })
  @ApiOkResponse({ type: MarketDataConfigResponseDto })
  getConfig(): MarketDataConfigResponseDto {
    return {
      supports_search: false,
      supports_group_request: false,
      supports_marks: true,
      supports_timescale_marks: true,
      supports_time: false,
      supported_resolutions: SUPPORTED_TV_RESOLUTIONS,
      symbols_types: [
        { name: 'All', value: '' },
        { name: 'Stock', value: 'stock' },
        { name: 'Crypto', value: 'crypto' },
        { name: 'Forex', value: 'forex' },
        { name: 'Futures', value: 'futures' },
      ],
      exchanges: [{ value: 'TJ', name: 'TradeJournal', desc: 'Simulated feed' }],
    };
  }

  @Get('history')
  @ApiOperation({
    summary: 'TradingView UDF historical bars',
    description:
      'Returns OHLCV bars in UDF shape (`s`, `t`, `o`, `h`, `l`, `c`, `v`). Times are Unix seconds.',
  })
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(MarketDataHistoryOkDto) },
        { $ref: getSchemaPath(MarketDataHistoryNoDataDto) },
        { $ref: getSchemaPath(MarketDataHistoryErrorDto) },
      ],
    },
  })
  async getHistory(
    @Query() query: MarketDataHistoryQueryDto,
    @Session() _session: UserSession,
  ): Promise<HistoryResponse> {
    const interval = parseResolution(query.resolution);
    if (!interval) {
      throw new BadRequestException(`Unsupported resolution: ${query.resolution}`);
    }

    if (query.to <= query.from) {
      return { s: 'error', errmsg: '`to` must be greater than `from`' };
    }

    const fromMs = query.from * 1000;
    const toMs = query.to * 1000;
    const step = INTERVAL_MS[interval];
    const estimated = Math.floor((toMs - fromMs) / step) + 1;
    if (estimated > MAX_CANDLES) {
      return {
        s: 'error',
        errmsg: `Requested window is too large (max ${MAX_CANDLES} candles)`,
      };
    }

    const candles = await this.marketDataService.getCandles(
      query.symbol,
      fromMs,
      toMs,
      interval,
    );

    if (candles.length === 0) {
      return { s: 'no_data', nextTime: query.from };
    }

    return {
      s: 'ok',
      t: candles.map((c) => Math.floor(c.time / 1000)),
      o: candles.map((c) => c.open),
      h: candles.map((c) => c.high),
      l: candles.map((c) => c.low),
      c: candles.map((c) => c.close),
      v: candles.map((c) => c.volume),
    };
  }
}
