import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  COMMUNITY_PLAYBOOK_TEMPLATE_CHECKLIST_ITEM_MAX_LENGTH,
  COMMUNITY_PLAYBOOK_TEMPLATE_NAME_MAX_LENGTH,
  COMMUNITY_PLAYBOOK_TEMPLATE_VISIBILITY,
  type CommunityPlaybookTemplateVisibility,
} from '../constants/community.constants';

export class CommunityPlaybookTemplateChecklistItemInputDto {
  @ApiProperty({ example: 'Confirm trend on higher timeframe' })
  @IsString()
  @MinLength(1)
  @MaxLength(COMMUNITY_PLAYBOOK_TEMPLATE_CHECKLIST_ITEM_MAX_LENGTH)
  text: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateCommunityPlaybookTemplateDto {
  @ApiProperty({ example: 'Opening Range Breakout' })
  @IsString()
  @MinLength(1)
  @MaxLength(COMMUNITY_PLAYBOOK_TEMPLATE_NAME_MAX_LENGTH)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marketConditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entryCriteria?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exitCriteria?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  riskRules?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invalidationRules?: string;

  @ApiPropertyOptional({
    enum: COMMUNITY_PLAYBOOK_TEMPLATE_VISIBILITY,
    default: 'members_only',
  })
  @IsOptional()
  @IsIn(COMMUNITY_PLAYBOOK_TEMPLATE_VISIBILITY)
  visibility?: CommunityPlaybookTemplateVisibility;

  @ApiPropertyOptional({ type: CommunityPlaybookTemplateChecklistItemInputDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CommunityPlaybookTemplateChecklistItemInputDto)
  checklist?: CommunityPlaybookTemplateChecklistItemInputDto[];
}

export class UpdateCommunityPlaybookTemplateDto {
  @ApiPropertyOptional({ example: 'Opening Range Breakout' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(COMMUNITY_PLAYBOOK_TEMPLATE_NAME_MAX_LENGTH)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  marketConditions?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  entryCriteria?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  exitCriteria?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  riskRules?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  invalidationRules?: string | null;

  @ApiPropertyOptional({ enum: COMMUNITY_PLAYBOOK_TEMPLATE_VISIBILITY })
  @IsOptional()
  @IsIn(COMMUNITY_PLAYBOOK_TEMPLATE_VISIBILITY)
  visibility?: CommunityPlaybookTemplateVisibility;

  @ApiPropertyOptional({ type: CommunityPlaybookTemplateChecklistItemInputDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CommunityPlaybookTemplateChecklistItemInputDto)
  checklist?: CommunityPlaybookTemplateChecklistItemInputDto[];
}
