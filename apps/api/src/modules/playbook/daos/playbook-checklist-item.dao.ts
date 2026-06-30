import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable, Updateable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { PlaybookChecklistItem } from '@/database/types/db';

@Injectable()
export class PlaybookChecklistItemDao extends KyselyDao<PlaybookChecklistItemDao> {
  static readonly TABLE = 'playbook_checklist_item' as const;

  async findByPlaybook(
    playbookId: string,
  ): Promise<Selectable<PlaybookChecklistItem>[]> {
    return this.kysely
      .selectFrom(PlaybookChecklistItemDao.TABLE)
      .selectAll()
      .where('playbookId', '=', playbookId)
      .orderBy('sortOrder', 'asc')
      .execute();
  }

  async findById(
    id: string,
  ): Promise<Selectable<PlaybookChecklistItem> | null> {
    const row = await this.kysely
      .selectFrom(PlaybookChecklistItemDao.TABLE)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ?? null;
  }

  async create(
    data: Insertable<PlaybookChecklistItem>,
  ): Promise<Selectable<PlaybookChecklistItem> | null> {
    const row = await this.kysely
      .insertInto(PlaybookChecklistItemDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async updateForPlaybook(
    id: string,
    playbookId: string,
    data: Updateable<PlaybookChecklistItem>,
  ): Promise<Selectable<PlaybookChecklistItem> | null> {
    const row = await this.kysely
      .updateTable(PlaybookChecklistItemDao.TABLE)
      .set(data)
      .where('id', '=', id)
      .where('playbookId', '=', playbookId)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async deleteForPlaybook(id: string, playbookId: string): Promise<boolean> {
    const result = await this.kysely
      .deleteFrom(PlaybookChecklistItemDao.TABLE)
      .where('id', '=', id)
      .where('playbookId', '=', playbookId)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }

  async deleteByPlaybook(playbookId: string): Promise<void> {
    await this.kysely
      .deleteFrom(PlaybookChecklistItemDao.TABLE)
      .where('playbookId', '=', playbookId)
      .execute();
  }

  async replaceForPlaybook(
    playbookId: string,
    items: { text: string; sortOrder: number }[],
  ): Promise<Selectable<PlaybookChecklistItem>[]> {
    await this.deleteByPlaybook(playbookId);
    if (items.length === 0) {
      return [];
    }

    const rows = await this.kysely
      .insertInto(PlaybookChecklistItemDao.TABLE)
      .values(
        items.map((item) => ({
          playbookId,
          text: item.text,
          sortOrder: item.sortOrder,
        })),
      )
      .returningAll()
      .execute();

    return rows;
  }
}
