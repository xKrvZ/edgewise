import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';

@Injectable()
export class TraderProfilePlaybookDao extends KyselyDao<TraderProfilePlaybookDao> {
  static readonly TABLE = 'trader_profile_playbook' as const;

  async findPlaybookIdsByUser(userId: string): Promise<string[]> {
    const rows = await this.kysely
      .selectFrom(TraderProfilePlaybookDao.TABLE)
      .select('playbookId')
      .where('userId', '=', userId)
      .execute();
    return rows.map((row) => row.playbookId);
  }

  async replaceForUser(userId: string, playbookIds: string[]): Promise<void> {
    await this.kysely.transaction().execute(async (trx) => {
      await trx
        .deleteFrom(TraderProfilePlaybookDao.TABLE)
        .where('userId', '=', userId)
        .execute();

      if (playbookIds.length === 0) {
        return;
      }

      await trx
        .insertInto(TraderProfilePlaybookDao.TABLE)
        .values(
          playbookIds.map((playbookId) => ({
            userId,
            playbookId,
          })),
        )
        .execute();
    });
  }

  async findSharedPlaybooksForUser(
    userId: string,
  ): Promise<{ name: string; description: string | null }[]> {
    return this.kysely
      .selectFrom(TraderProfilePlaybookDao.TABLE)
      .innerJoin('playbook', 'playbook.id', `${TraderProfilePlaybookDao.TABLE}.playbookId`)
      .select(['playbook.name as name', 'playbook.description as description'])
      .where(`${TraderProfilePlaybookDao.TABLE}.userId`, '=', userId)
      .orderBy('playbook.name', 'asc')
      .execute();
  }
}
