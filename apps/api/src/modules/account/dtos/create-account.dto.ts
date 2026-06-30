import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  ACCOUNT_CURRENCIES,
  ACCOUNT_TYPES,
  type AccountType,
  CHALLENGE_STATUSES,
  type ChallengeStatus,
} from '../constants/account.constants';

export class CreateAccountDto {
  @ApiProperty({ example: 'Main Live Account' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'Interactive Brokers' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  broker?: string;

  @ApiPropertyOptional({ enum: ACCOUNT_TYPES, default: 'live' })
  @IsOptional()
  @IsIn(ACCOUNT_TYPES)
  type?: AccountType;

  @ApiPropertyOptional({ enum: ACCOUNT_CURRENCIES, default: 'USD' })
  @IsOptional()
  @IsIn(ACCOUNT_CURRENCIES)
  currency?: string;

  @ApiPropertyOptional({ example: 25000, default: 0 })
  @IsOptional()
  @IsNumber()
  startingBalance?: number;

  @ApiPropertyOptional({ example: 25000, default: 0 })
  @IsOptional()
  @IsNumber()
  currentBalance?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({ nullable: true, example: 'FTMO' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firmName?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 10000 })
  @IsOptional()
  @IsNumber()
  profitTarget?: number | null;

  @ApiPropertyOptional({ nullable: true, example: 5000 })
  @IsOptional()
  @IsNumber()
  dailyLossLimit?: number | null;

  @ApiPropertyOptional({ nullable: true, example: 10000 })
  @IsOptional()
  @IsNumber()
  maxLossLimit?: number | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  trailingDrawdown?: boolean;

  @ApiPropertyOptional({ enum: CHALLENGE_STATUSES, nullable: true })
  @IsOptional()
  @IsIn(CHALLENGE_STATUSES)
  challengeStatus?: ChallengeStatus | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @IsDateString()
  challengeStartedAt?: string | null;
}
