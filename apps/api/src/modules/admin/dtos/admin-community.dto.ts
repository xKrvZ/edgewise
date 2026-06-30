import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminCommunitiesQueryDto {
  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({ description: 'Filter by community name or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by discover visibility (true = hidden only)' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  discoverHidden?: boolean;

  @ApiPropertyOptional({ description: 'Filter by featured status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;
}

export class AdminCommunityRowDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty()
  joinPolicy!: string;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  creatorEmail!: string;

  @ApiProperty({ nullable: true })
  creatorName!: string | null;

  @ApiProperty({ nullable: true })
  creatorDisplayName!: string | null;

  @ApiProperty()
  memberCount!: number;

  @ApiProperty()
  postCount!: number;

  @ApiProperty({ nullable: true })
  discoverHiddenAt!: string | null;

  @ApiProperty()
  featured!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class AdminCommunitiesPageDto {
  @ApiProperty({ type: [AdminCommunityRowDto] })
  items!: AdminCommunityRowDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  offset!: number;
}

export class AdminCommunityDetailDto extends AdminCommunityRowDto {}

export class AdminCommunityPostsQueryDto {
  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({ default: true, description: 'Include soft-deleted posts' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDeleted?: boolean = true;
}

export class AdminCommunityPostRowDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  communityId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  visibility!: string;

  @ApiProperty()
  authorUserId!: string;

  @ApiProperty()
  authorEmail!: string;

  @ApiProperty({ nullable: true })
  authorName!: string | null;

  @ApiProperty({ nullable: true })
  authorDisplayName!: string | null;

  @ApiProperty()
  publishedAt!: string;

  @ApiProperty({ nullable: true })
  deletedAt!: string | null;

  @ApiProperty({ nullable: true })
  discoverHiddenAt!: string | null;
}

export class AdminCommunityPostsPageDto {
  @ApiProperty({ type: [AdminCommunityPostRowDto] })
  items!: AdminCommunityPostRowDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  offset!: number;
}
