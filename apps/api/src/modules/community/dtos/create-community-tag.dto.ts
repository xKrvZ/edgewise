import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommunityTagDto {
  @ApiProperty({ example: 'Beginner' })
  @IsString()
  @MaxLength(60)
  name: string;

  @ApiPropertyOptional({ example: '#10b981' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
