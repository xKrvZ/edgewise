import { Injectable } from '@nestjs/common';
import { sql, type Insertable, type Selectable, type Updateable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { Playbook } from '@/database/types/db';

@Injectable()
export class PlaybookDao extends KyselyDao<PlaybookDao> {
  static readonly TABLE = 'playbook' as const;

  async findAllByUser(userId: string): Promise<Selectable<Playbook>[]> {
    return this.kysely
      .selectFrom(PlaybookDao.TABLE)
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('name', 'asc')
      .execute();
  }

  async findById(id: string): Promise<Selectable<Playbook> | null> {
    const row = await this.kysely
      .selectFrom(PlaybookDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ?? null;
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<Selectable<Playbook> | null> {
    const row = await this.kysely
      .selectFrom(PlaybookDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  async create(
    data: Insertable<Playbook>,
  ): Promise<Selectable<Playbook> | null> {
    const row = await this.kysely
      .insertInto(PlaybookDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async updateForUser(
    id: string,
    userId: string,
    data: Updateable<Playbook>,
  ): Promise<Selectable<Playbook> | null> {
    const row = await this.kysely
      .updateTable(PlaybookDao.TABLE)
      .set({ ...data, updatedAt: sql`now()` })
      .where('id', '=', id)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(PlaybookDao.TABLE)
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }

  async findClonedTemplateIdsForUser(
    userId: string,
    templateIds: string[],
  ): Promise<Set<string>> {
    if (templateIds.length === 0) {
      return new Set();
    }

    const rows = await this.kysely
      .selectFrom(PlaybookDao.TABLE)
      .select('clonedFromCommunityTemplateId')
      .where('userId', '=', userId)
      .where('clonedFromCommunityTemplateId', 'in', templateIds)
      .execute();

    return new Set(
      rows
        .map((row) => row.clonedFromCommunityTemplateId)
        .filter((id): id is string => id !== null),
    );
  }

  async hasClonedFromTemplate(userId: string, templateId: string): Promise<boolean> {
    const row = await this.kysely
      .selectFrom(PlaybookDao.TABLE)
      .select('id')
      .where('userId', '=', userId)
      .where('clonedFromCommunityTemplateId', '=', templateId)
      .executeTakeFirst();
    return row !== undefined;
  }
}
