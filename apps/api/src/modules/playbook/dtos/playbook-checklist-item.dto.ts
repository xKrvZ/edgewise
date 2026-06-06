import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { Selectable } from 'kysely';
import type { PlaybookChecklistItem } from '@/database/types/db';

export class PlaybookChecklistItemDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() playbookId: string;
  @Expose() @ApiProperty({ example: 'Confirm trend on higher timeframe' }) text: string;
  @Expose() @ApiProperty({ example: 0 }) sortOrder: number;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
}

export function toChecklistItemDto(
  row: Selectable<PlaybookChecklistItem>,
): PlaybookChecklistItemDto {
  return {
    id: row.id,
    playbookId: row.playbookId,
    text: row.text,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
  };
}

export class CreateChecklistItemDto {
  @ApiProperty({ example: 'Confirm trend on higher timeframe' })
  @IsString()
  @MaxLength(280)
  text: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateChecklistItemDto {
  @ApiPropertyOptional({ example: 'Confirm trend on higher timeframe' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  text?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
