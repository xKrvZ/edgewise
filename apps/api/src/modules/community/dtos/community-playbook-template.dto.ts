import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { Selectable } from 'kysely';
import type { CommunityPlaybookTemplateChecklistItem } from '@/database/types/db';
import type { CommunityPlaybookTemplateVisibility } from '../constants/community.constants';

export class CommunityPlaybookTemplateChecklistItemDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() templateId: string;
  @Expose() @ApiProperty({ example: 'Confirm trend on higher timeframe' }) text: string;
  @Expose() @ApiProperty({ example: 0 }) sortOrder: number;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
}

export function toCommunityPlaybookTemplateChecklistItemDto(
  row: Selectable<CommunityPlaybookTemplateChecklistItem>,
): CommunityPlaybookTemplateChecklistItemDto {
  return {
    id: row.id,
    templateId: row.templateId,
    text: row.text,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
  };
}

export class CommunityPlaybookTemplateDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() communityId: string;
  @Expose() @ApiProperty() createdByUserId: string;
  @Expose() @ApiProperty({ example: 'Opening Range Breakout' }) name: string;
  @Expose() @ApiProperty({ nullable: true }) description: string | null;
  @Expose() @ApiProperty({ nullable: true }) marketConditions: string | null;
  @Expose() @ApiProperty({ nullable: true }) entryCriteria: string | null;
  @Expose() @ApiProperty({ nullable: true }) exitCriteria: string | null;
  @Expose() @ApiProperty({ nullable: true }) riskRules: string | null;
  @Expose() @ApiProperty({ nullable: true }) invalidationRules: string | null;
  @Expose()
  @ApiProperty({ enum: ['public', 'members_only'] })
  visibility: CommunityPlaybookTemplateVisibility;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;
  @Expose()
  @ApiProperty({ type: CommunityPlaybookTemplateChecklistItemDto, isArray: true })
  checklist: CommunityPlaybookTemplateChecklistItemDto[];

  @Expose()
  @ApiProperty({
    description: 'Whether the current user has already cloned this template into their playbooks',
  })
  alreadyCloned: boolean;
}

export function toCommunityPlaybookTemplateDto(
  row: Selectable<import('@/database/types/db').CommunityPlaybookTemplate>,
  checklist: Selectable<CommunityPlaybookTemplateChecklistItem>[] = [],
  alreadyCloned = false,
): CommunityPlaybookTemplateDto {
  return {
    id: row.id,
    communityId: row.communityId,
    createdByUserId: row.createdByUserId,
    name: row.name,
    description: row.description,
    marketConditions: row.marketConditions,
    entryCriteria: row.entryCriteria,
    exitCriteria: row.exitCriteria,
    riskRules: row.riskRules,
    invalidationRules: row.invalidationRules,
    visibility: row.visibility as CommunityPlaybookTemplateVisibility,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    checklist: checklist.map(toCommunityPlaybookTemplateChecklistItemDto),
    alreadyCloned,
  };
}
