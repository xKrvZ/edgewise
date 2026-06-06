import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { Instrument } from '@/database/types/db';
import type { Selectable } from 'kysely';

@Injectable()
export class InstrumentDao extends KyselyDao<InstrumentDao> {
  static readonly TABLE = 'instrument' as const;

  async search(
    query: string,
    limit: number,
  ): Promise<Selectable<Instrument>[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const prefix = `${trimmed}%`;
    const contains = `%${trimmed}%`;

    return this.kysely
      .selectFrom(InstrumentDao.TABLE)
      .selectAll()
      .where('isActive', '=', true)
      .where((eb) =>
        eb.or([
          eb('symbol', 'ilike', contains),
          eb('name', 'ilike', contains),
        ]),
      )
      .orderBy(
        sql`CASE
          WHEN LOWER(symbol) = LOWER(${trimmed}) THEN 0
          WHEN symbol ILIKE ${prefix} THEN 1
          WHEN name ILIKE ${prefix} THEN 2
          ELSE 3
        END`,
      )
      .orderBy('symbol', 'asc')
      .limit(limit)
      .execute();
  }

  async findBySymbol(symbol: string): Promise<Selectable<Instrument> | null> {
    const row = await this.kysely
      .selectFrom(InstrumentDao.TABLE)
      .selectAll()
      .where('symbol', '=', symbol)
      .executeTakeFirst();
    return row ?? null;
  }
}
