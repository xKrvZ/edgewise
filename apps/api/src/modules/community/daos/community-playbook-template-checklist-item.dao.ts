import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { CommunityPlaybookTemplateChecklistItem } from '@/database/types/db';

@Injectable()
export class CommunityPlaybookTemplateChecklistItemDao extends KyselyDao<CommunityPlaybookTemplateChecklistItemDao> {
  static readonly TABLE = 'community_playbook_template_checklist_item' as const;

  async findByTemplate(
    templateId: string,
  ): Promise<Selectable<CommunityPlaybookTemplateChecklistItem>[]> {
    return this.kysely
      .selectFrom(CommunityPlaybookTemplateChecklistItemDao.TABLE)
      .selectAll()
      .where('templateId', '=', templateId)
      .orderBy('sortOrder', 'asc')
      .execute();
  }

  async create(
    data: Insertable<CommunityPlaybookTemplateChecklistItem>,
  ): Promise<Selectable<CommunityPlaybookTemplateChecklistItem> | null> {
    const row = await this.kysely
      .insertInto(CommunityPlaybookTemplateChecklistItemDao.TABLE)
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return row ?? null;
  }

  async deleteByTemplate(templateId: string): Promise<void> {
    await this.kysely
      .deleteFrom(CommunityPlaybookTemplateChecklistItemDao.TABLE)
      .where('templateId', '=', templateId)
      .execute();
  }

  async replaceForTemplate(
    templateId: string,
    items: { text: string; sortOrder: number }[],
  ): Promise<Selectable<CommunityPlaybookTemplateChecklistItem>[]> {
    await this.deleteByTemplate(templateId);
    if (items.length === 0) {
      return [];
    }

    const rows = await this.kysely
      .insertInto(CommunityPlaybookTemplateChecklistItemDao.TABLE)
      .values(
        items.map((item) => ({
          templateId,
          text: item.text,
          sortOrder: item.sortOrder,
        })),
      )
      .returningAll()
      .execute();

    return rows;
  }
}
