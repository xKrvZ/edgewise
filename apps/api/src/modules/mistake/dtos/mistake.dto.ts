import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { Selectable } from 'kysely';
import type { Mistake } from '@/database/types/db';

export class MistakeDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  userId: string;

  @Expose()
  @ApiProperty({ example: 'Moved stop loss' })
  name: string;

  @Expose()
  @ApiProperty({ nullable: true, example: '#ef4444' })
  color: string | null;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export function toMistakeDto(row: Selectable<Mistake>): MistakeDto {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt,
  };
}
