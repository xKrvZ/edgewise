import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { Selectable } from 'kysely';
import type { CommunityTag } from '@/database/types/db';

export class CommunityTagDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  communityId: string;

  @Expose()
  @ApiProperty({ example: 'Beginner' })
  name: string;

  @Expose()
  @ApiProperty({ nullable: true, example: '#10b981' })
  color: string | null;

  @Expose()
  @ApiProperty()
  createdBy: string;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export function toCommunityTagDto(row: Selectable<CommunityTag>): CommunityTagDto {
  return {
    id: row.id,
    communityId: row.communityId,
    name: row.name,
    color: row.color,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  };
}
