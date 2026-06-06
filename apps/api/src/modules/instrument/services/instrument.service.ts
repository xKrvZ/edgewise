import { Injectable, NotFoundException } from '@nestjs/common';
import { InstrumentDao } from '../daos/instrument.dao';
import { InstrumentDto, toInstrumentDto } from '../dtos/instrument.dto';

/**
 * Global instrument catalog for trade logging and replay market-data lookup.
 *
 * Replay resolution path:
 *   trade.symbol → InstrumentService.getBySymbol() → instrument.providerSymbol ?? instrument.symbol
 *   → MarketDataService.getCandles(providerSymbol, from, to, interval)
 *
 * The catalog stores canonical symbols on trades; providerSymbol bridges to the
 * active market-data feed when tickers differ (e.g. BTCUSD → BTC on mock provider).
 */
@Injectable()
export class InstrumentService {
  constructor(private readonly instrumentDao: InstrumentDao) {}

  async search(query: string, limit = 20): Promise<InstrumentDto[]> {
    const rows = await this.instrumentDao.search(query, limit);
    return rows.map(toInstrumentDto);
  }

  async getBySymbol(symbol: string): Promise<InstrumentDto> {
    const normalized = symbol.trim().toUpperCase();
    const row = await this.instrumentDao.findBySymbol(normalized);
    if (!row || !row.isActive) {
      throw new NotFoundException(`Instrument ${normalized} not found`);
    }
    return toInstrumentDto(row);
  }

  /** Returns true when the symbol exists and is active in the catalog. */
  async isKnownSymbol(symbol: string): Promise<boolean> {
    const normalized = symbol.trim().toUpperCase();
    const row = await this.instrumentDao.findBySymbol(normalized);
    return row !== null && row.isActive;
  }

  /**
   * Resolves the symbol to pass to the market-data provider for replay/charts.
   * Returns null when the instrument is unknown.
   */
  async resolveProviderSymbol(symbol: string): Promise<string | null> {
    const normalized = symbol.trim().toUpperCase();
    const row = await this.instrumentDao.findBySymbol(normalized);
    if (!row || !row.isActive) return null;
    return row.providerSymbol ?? row.symbol;
  }
}
