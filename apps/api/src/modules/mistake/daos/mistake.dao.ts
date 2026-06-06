import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable, Updateable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { Mistake } from '@/database/types/db';

@Injectable()
export class MistakeDao extends KyselyDao<MistakeDao> {
  static readonly TABLE = 'mistake' as const;

  async findAllByUser(userId: string): Promise<Selectable<Mistake>[]> {
    return this.kysely
      .selectFrom(MistakeDao.TABLE)
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('name', 'asc')
      .execute();
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<Selectable<Mistake> | null> {
    const row = await this.kysely
      .selectFrom(MistakeDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  async create(data: Insertable<Mistake>): Promise<Selectable<Mistake> | null> {
    const row = await this.kysely
      .insertInto(MistakeDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async updateForUser(
    id: string,
    userId: string,
    data: Updateable<Mistake>,
  ): Promise<Selectable<Mistake> | null> {
    const row = await this.kysely
      .updateTable(MistakeDao.TABLE)
      .set(data)
      .where('id', '=', id)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(MistakeDao.TABLE)
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
