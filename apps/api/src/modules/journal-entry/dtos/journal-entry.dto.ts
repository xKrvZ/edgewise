import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import type { Selectable } from 'kysely';
import type { JournalEntry } from '@/database/types/db';
import { PaginationDto } from '@/database/dtos/filter.dto';
import { MAX_JOURNAL_ENTRY_TRADES } from '../constants/journal-entry.constants';

export class JournalEntryTradeSummaryDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty({ example: 'AAPL' }) symbol: string;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) entryTime: Date;
}

export class JournalEntryDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() userId: string;
  @Expose()
  @ApiProperty({ type: String, isArray: true })
  tradeIds: string[];
  @Expose()
  @ApiProperty({ type: JournalEntryTradeSummaryDto, isArray: true })
  trades: JournalEntryTradeSummaryDto[];
  @Expose() @ApiProperty({ type: String, format: 'date' }) date: Date;
  @Expose() @ApiProperty({ nullable: true }) title: string | null;
  @Expose() @ApiProperty() content: string;
  @Expose() @ApiProperty({ nullable: true, example: 'calm' }) mood: string | null;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;
}

export function toJournalEntryDto(
  row: Selectable<JournalEntry>,
  relations?: {
    tradeIds?: string[];
    trades?: JournalEntryTradeSummaryDto[];
  },
): JournalEntryDto {
  return {
    id: row.id,
    userId: row.userId,
    tradeIds: relations?.tradeIds ?? [],
    trades: relations?.trades ?? [],
    date: row.date,
    title: row.title,
    content: row.content,
    mood: row.mood,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class CreateJournalEntryDto {
  @ApiPropertyOptional({
    description: 'Trade ids to link (max 50)',
    type: String,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  @ArrayMaxSize(MAX_JOURNAL_ENTRY_TRADES)
  tradeIds?: string[];

  @ApiProperty({ type: String, format: 'date', example: '2026-06-05' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'calm' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  mood?: string;
}

export class UpdateJournalEntryDto {
  @ApiPropertyOptional({
    description: 'Trade ids to link (replaces existing links, max 50)',
    type: String,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  @ArrayMaxSize(MAX_JOURNAL_ENTRY_TRADES)
  tradeIds?: string[];

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  mood?: string;
}

export class JournalEntryQueryDto extends PaginationDto {
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter entries linked to a trade id' })
  @IsOptional()
  @IsUUID()
  tradeId?: string;
}
