import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { TAG_CATEGORIES, type TagCategory } from '../constants/tag.constants';

export class CreateTagDto {
  @ApiProperty({ example: 'Breakout' })
  @IsString()
  @MaxLength(60)
  name: string;

  @ApiPropertyOptional({ example: '#10b981' })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ enum: TAG_CATEGORIES, default: 'custom' })
  @IsOptional()
  @IsIn(TAG_CATEGORIES)
  category?: TagCategory;
}
