import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { Selectable } from 'kysely';
import type { Tag } from '@/database/types/db';
import { TAG_CATEGORIES, type TagCategory } from '../constants/tag.constants';

export class TagDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  userId: string;

  @Expose()
  @ApiProperty({ example: 'Breakout' })
  name: string;

  @Expose()
  @ApiProperty({ nullable: true, example: '#10b981' })
  color: string | null;

  @Expose()
  @ApiProperty({ enum: TAG_CATEGORIES, example: 'setup' })
  category: TagCategory;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export function toTagDto(row: Selectable<Tag>): TagDto {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    color: row.color,
    category: row.category as TagCategory,
    createdAt: row.createdAt,
  };
}
