import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CommunityListQueryDto {
  @ApiPropertyOptional({ description: 'Filter to featured communities only' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Filter by community name or description' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
