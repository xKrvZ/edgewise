import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateChecklistItemDto } from './playbook-checklist-item.dto';

export class CreatePlaybookDto {
  @ApiProperty({ example: 'Opening Range Breakout' })
  @IsString()
  @MaxLength(120)
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

  @ApiPropertyOptional({ type: CreateChecklistItemDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateChecklistItemDto)
  checklist?: CreateChecklistItemDto[];
}
