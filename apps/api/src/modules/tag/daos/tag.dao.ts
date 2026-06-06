import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable, Updateable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { Tag } from '@/database/types/db';

@Injectable()
export class TagDao extends KyselyDao<TagDao> {
  static readonly TABLE = 'tag' as const;

  async findAllByUser(userId: string): Promise<Selectable<Tag>[]> {
    return this.kysely
      .selectFrom(TagDao.TABLE)
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('name', 'asc')
      .execute();
  }

  async findByIdForUser(id: string, userId: string): Promise<Selectable<Tag> | null> {
    const row = await this.kysely
      .selectFrom(TagDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  async create(data: Insertable<Tag>): Promise<Selectable<Tag> | null> {
    const row = await this.kysely
      .insertInto(TagDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async updateForUser(
    id: string,
    userId: string,
    data: Updateable<Tag>,
  ): Promise<Selectable<Tag> | null> {
    const row = await this.kysely
      .updateTable(TagDao.TABLE)
      .set(data)
      .where('id', '=', id)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(TagDao.TABLE)
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
