import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

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
}
