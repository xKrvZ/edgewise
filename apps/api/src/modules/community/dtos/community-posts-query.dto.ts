import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CommunityPostsQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of posts to return',
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;

  @ApiPropertyOptional({ description: 'Post id to exclude from results (e.g. the current post)' })
  @IsOptional()
  @IsUUID()
  exclude?: string;
}
