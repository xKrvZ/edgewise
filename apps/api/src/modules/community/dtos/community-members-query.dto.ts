import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

function toTagIdArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map(String);
  }
  return [String(value)];
}

export class CommunityMembersQueryDto {
  @ApiPropertyOptional({
    description: 'Filter members that have all of these tag ids',
    type: String,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => toTagIdArray(value))
  @IsArray()
  @IsUUID('all', { each: true })
  tag?: string[];

  @ApiPropertyOptional({ description: 'Search members by display name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
