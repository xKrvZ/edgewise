import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCommunityTagDto {
  @ApiPropertyOptional({ example: 'Advanced' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional({ example: '#6366f1', nullable: true })
  @IsOptional()
  @IsHexColor()
  color?: string | null;
}
