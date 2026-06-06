import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMistakeDto {
  @ApiProperty({ example: 'Moved stop loss' })
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: '#ef4444' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
