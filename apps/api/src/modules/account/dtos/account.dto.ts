import type { TradingAccount } from '@/database/types/db';
import { toNumber, toRequiredNumber } from '@/database/utils/numeric.util';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { Selectable } from 'kysely';
import type { AccountType, ChallengeStatus } from '../constants/account.constants';
import { CHALLENGE_STATUSES } from '../constants/account.constants';

export class AccountDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  @ApiProperty({ description: 'Owning user id' })
  userId: string;

  @Expose()
  @ApiProperty({ example: 'Main Live Account' })
  name: string;

  @Expose()
  @ApiProperty({ nullable: true, example: 'Interactive Brokers' })
  broker: string | null;

  @Expose()
  @ApiProperty({ enum: ['live', 'paper', 'prop'], example: 'live' })
  type: AccountType;

  @Expose()
  @ApiProperty({ example: 'USD' })
  currency: string;

  @Expose()
  @ApiProperty({ example: 25000 })
  startingBalance: number;

  @Expose()
  @ApiProperty({ example: 28450.75 })
  currentBalance: number;

  @Expose()
  @ApiProperty({ example: false })
  isArchived: boolean;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: 'FTMO' })
  firmName: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: 10000 })
  profitTarget: number | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: 5000 })
  dailyLossLimit: number | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: 10000 })
  maxLossLimit: number | null;

  @Expose()
  @ApiProperty({ example: false })
  trailingDrawdown: boolean;

  @Expose()
  @ApiPropertyOptional({ enum: CHALLENGE_STATUSES, nullable: true, example: 'active' })
  challengeStatus: ChallengeStatus | null;

  @Expose()
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  challengeStartedAt: Date | null;

  @Expose()
  @ApiProperty({ example: 0 })
  daysTraded: number;

  @Expose()
  @ApiProperty({
    example: 5,
    description:
      'Absolute P&L band (in account currency) treated as breakeven for win/loss classification',
  })
  breakevenRange: number;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export function toAccountDto(row: Selectable<TradingAccount>): AccountDto {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    broker: row.broker,
    type: row.type as AccountType,
    currency: row.currency,
    startingBalance: toRequiredNumber(row.startingBalance),
    currentBalance: toRequiredNumber(row.currentBalance),
    isArchived: row.isArchived,
    firmName: row.firmName,
    profitTarget: toNumber(row.profitTarget),
    dailyLossLimit: toNumber(row.dailyLossLimit),
    maxLossLimit: toNumber(row.maxLossLimit),
    trailingDrawdown: row.trailingDrawdown,
    challengeStatus: row.challengeStatus as ChallengeStatus | null,
    challengeStartedAt: row.challengeStartedAt,
    daysTraded: row.daysTraded,
    breakevenRange: toRequiredNumber(row.breakevenRange),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
