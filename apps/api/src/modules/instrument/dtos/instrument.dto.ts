import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { Selectable } from 'kysely';
import type { Instrument } from '@/database/types/db';
import { ASSET_CLASSES, type AssetClass } from '../constants/instrument.constants';

export class InstrumentDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty({ example: 'ES' })
  symbol: string;

  @Expose()
  @ApiProperty({ example: 'E-mini S&P 500' })
  name: string;

  @Expose()
  @ApiProperty({ enum: ASSET_CLASSES, example: 'futures' })
  assetClass: AssetClass;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: 'CME' })
  exchange: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: 'USD' })
  currency: string | null;

  @Expose()
  @ApiPropertyOptional({
    nullable: true,
    description:
      'Provider-specific symbol for market-data replay (falls back to symbol when null)',
    example: 'BTC',
  })
  providerSymbol: string | null;

  @Expose()
  @ApiProperty()
  isActive: boolean;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export function toInstrumentDto(row: Selectable<Instrument>): InstrumentDto {
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    assetClass: row.assetClass as AssetClass,
    exchange: row.exchange,
    currency: row.currency,
    providerSymbol: row.providerSymbol,
    isActive: row.isActive,
    createdAt: row.createdAt,
  };
}
