import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { InstrumentService } from '../services/instrument.service';
import { InstrumentDto } from '../dtos/instrument.dto';
import { InstrumentSearchQueryDto } from '../dtos/instrument-search-query.dto';

@ApiTags('Instruments')
@Controller('instruments')
export class InstrumentController {
  constructor(private readonly instrumentService: InstrumentService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search the instrument catalog by symbol or name' })
  @ApiOkResponse({ type: InstrumentDto, isArray: true })
  async search(
    @Query() query: InstrumentSearchQueryDto,
    @Session() _session: UserSession,
  ): Promise<InstrumentDto[]> {
    return this.instrumentService.search(query.q, query.limit ?? 20);
  }

  @Get(':symbol')
  @ApiOperation({ summary: 'Get an instrument by canonical symbol' })
  @ApiOkResponse({ type: InstrumentDto })
  async getBySymbol(
    @Param('symbol') symbol: string,
    @Session() _session: UserSession,
  ): Promise<InstrumentDto> {
    return this.instrumentService.getBySymbol(symbol);
  }
}
