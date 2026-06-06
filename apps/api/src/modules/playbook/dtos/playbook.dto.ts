import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { Selectable } from 'kysely';
import type { Playbook } from '@/database/types/db';
import {
  PlaybookChecklistItemDto,
  toChecklistItemDto,
} from './playbook-checklist-item.dto';

export class PlaybookDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() userId: string;
  @Expose() @ApiProperty({ example: 'Opening Range Breakout' }) name: string;
  @Expose() @ApiProperty({ nullable: true }) description: string | null;
  @Expose() @ApiProperty({ nullable: true }) marketConditions: string | null;
  @Expose() @ApiProperty({ nullable: true }) entryCriteria: string | null;
  @Expose() @ApiProperty({ nullable: true }) exitCriteria: string | null;
  @Expose() @ApiProperty({ nullable: true }) riskRules: string | null;
  @Expose() @ApiProperty({ nullable: true }) invalidationRules: string | null;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;

  @Expose()
  @ApiPropertyOptional({ type: PlaybookChecklistItemDto, isArray: true })
  checklist?: PlaybookChecklistItemDto[];
}

export function toPlaybookDto(
  row: Selectable<Playbook>,
  checklist?: Parameters<typeof toChecklistItemDto>[0][],
): PlaybookDto {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    marketConditions: row.marketConditions,
    entryCriteria: row.entryCriteria,
    exitCriteria: row.exitCriteria,
    riskRules: row.riskRules,
    invalidationRules: row.invalidationRules,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...(checklist ? { checklist: checklist.map(toChecklistItemDto) } : {}),
  };
}
