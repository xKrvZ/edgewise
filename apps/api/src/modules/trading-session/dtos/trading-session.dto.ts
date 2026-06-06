import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { Selectable } from 'kysely';
import type { TradingSession } from '@/database/types/db';

export class TradingSessionDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  userId: string;

  @Expose()
  @ApiProperty({ example: 'London' })
  name: string;

  @Expose()
  @ApiProperty({ example: '08:00:00', description: 'Session start (24h time)' })
  startTime: string;

  @Expose()
  @ApiProperty({ example: '16:30:00', description: 'Session end (24h time)' })
  endTime: string;

  @Expose()
  @ApiProperty({ nullable: true, example: 'Europe/London' })
  timezone: string | null;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export function toTradingSessionDto(
  row: Selectable<TradingSession>,
): TradingSessionDto {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    startTime: row.startTime,
    endTime: row.endTime,
    timezone: row.timezone,
    createdAt: row.createdAt,
  };
}
