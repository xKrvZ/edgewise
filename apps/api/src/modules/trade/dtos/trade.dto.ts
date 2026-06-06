import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { Selectable } from 'kysely';
import type { Trade } from '@/database/types/db';
import { toNumber, toRequiredNumber } from '@/database/utils/numeric.util';
import type {
  MarketType,
  TradeDirection,
  TradeStatus,
} from '../constants/trade.constants';
import type { TradeVisibility } from '@/modules/sharing/constants/sharing.constants';

export class TradeDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() userId: string;
  @Expose() @ApiProperty() accountId: string;
  @Expose() @ApiProperty({ example: 'AAPL' }) symbol: string;

  @Expose()
  @ApiProperty({ enum: ['stocks', 'futures', 'forex', 'crypto', 'options'] })
  marketType: MarketType;

  @Expose() @ApiProperty({ enum: ['long', 'short'] }) direction: TradeDirection;
  @Expose() @ApiProperty({ example: 185.4 }) entryPrice: number;
  @Expose() @ApiProperty({ nullable: true, example: 191.2 }) exitPrice: number | null;
  @Expose() @ApiProperty({ example: 100 }) quantity: number;
  @Expose() @ApiProperty({ nullable: true }) stopLoss: number | null;
  @Expose() @ApiProperty({ nullable: true }) takeProfit: number | null;
  @Expose() @ApiProperty({ example: 1.5 }) fees: number;
  @Expose() @ApiProperty({ nullable: true, example: 575.0 }) pnl: number | null;
  @Expose() @ApiProperty({ nullable: true, example: 2.1 }) rMultiple: number | null;

  @Expose() @ApiProperty({ type: String, format: 'date-time' }) entryTime: Date;
  @Expose()
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  exitTime: Date | null;

  @Expose() @ApiProperty({ nullable: true }) setupId: string | null;
  @Expose() @ApiProperty({ nullable: true }) playbookId: string | null;
  @Expose() @ApiProperty({ nullable: true }) sessionId: string | null;
  @Expose() @ApiProperty({ nullable: true, example: 'confident' }) emotion: string | null;
  @Expose()
  @ApiProperty({ nullable: true, minimum: 1, maximum: 5, example: 4 })
  executionRating: number | null;
  @Expose() @ApiProperty({ nullable: true }) notes: string | null;
  @Expose() @ApiProperty({ enum: ['open', 'closed'] }) status: TradeStatus;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;

  @Expose()
  @ApiProperty({ type: String, isArray: true })
  tagIds: string[];

  @Expose()
  @ApiProperty({ type: String, isArray: true })
  mistakeIds: string[];

  @Expose()
  @ApiProperty({ enum: ['private', 'unlisted', 'public'], example: 'private' })
  visibility: TradeVisibility;

  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Opaque share token; null when visibility is private',
  })
  shareToken: string | null;
}

export function toTradeDto(
  row: Selectable<Trade>,
  relations?: { tagIds?: string[]; mistakeIds?: string[] },
): TradeDto {
  return {
    id: row.id,
    userId: row.userId,
    accountId: row.accountId,
    symbol: row.symbol,
    marketType: row.marketType as MarketType,
    direction: row.direction as TradeDirection,
    entryPrice: toRequiredNumber(row.entryPrice),
    exitPrice: toNumber(row.exitPrice),
    quantity: toRequiredNumber(row.quantity),
    stopLoss: toNumber(row.stopLoss),
    takeProfit: toNumber(row.takeProfit),
    fees: toRequiredNumber(row.fees),
    pnl: toNumber(row.pnl),
    rMultiple: toNumber(row.rMultiple),
    entryTime: row.entryTime,
    exitTime: row.exitTime,
    setupId: row.setupId,
    playbookId: row.playbookId,
    sessionId: row.sessionId,
    emotion: row.emotion,
    executionRating: row.executionRating,
    notes: row.notes,
    status: row.status as TradeStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tagIds: relations?.tagIds ?? [],
    mistakeIds: relations?.mistakeIds ?? [],
    visibility: (row.visibility ?? 'private') as TradeVisibility,
    shareToken: row.shareToken ?? null,
  };
}
