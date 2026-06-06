import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { DB } from '@/database/types/db';
import { ANONYMIZED_EMAIL_DOMAIN } from '../constants/privacy.constants';

export interface UserPrivacyRecord {
  id: string;
  email: string;
  name: string;
  role: string | null;
  deletedAt: Date | null;
  anonymizedAt: Date | null;
}

@Injectable()
export class PrivacyUserDao extends KyselyDao<PrivacyUserDao> {
  static readonly TABLE = 'user' as keyof DB;

  async findById(userId: string): Promise<UserPrivacyRecord | null> {
    const row = await this.kysely
      .selectFrom(PrivacyUserDao.TABLE)
      .select(['id', 'email', 'name', 'role', 'deletedAt', 'anonymizedAt'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!row?.id) {
      return null;
    }

    return {
      id: String(row.id),
      email: String(row.email),
      name: String(row.name ?? ''),
      role: row.role ?? null,
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
      anonymizedAt: row.anonymizedAt ? new Date(row.anonymizedAt) : null,
    };
  }

  async findDeletedUserIds(userIds: string[]): Promise<Set<string>> {
    if (userIds.length === 0) {
      return new Set();
    }

    const rows = await this.kysely
      .selectFrom(PrivacyUserDao.TABLE)
      .select(['id'])
      .where('id', 'in', userIds)
      .where((eb) =>
        eb.or([
          eb('deletedAt', 'is not', null),
          eb('anonymizedAt', 'is not', null),
          eb('email', 'like', `%${ANONYMIZED_EMAIL_DOMAIN}`),
        ]),
      )
      .execute();

    return new Set(rows.map((row) => String(row.id)));
  }

  async countAdministrators(excludeUserId?: string): Promise<number> {
    let query = this.kysely
      .selectFrom(PrivacyUserDao.TABLE)
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('role', '=', 'Administrator')
      .where('deletedAt', 'is', null)
      .where('anonymizedAt', 'is', null);

    if (excludeUserId) {
      query = query.where('id', '!=', excludeUserId);
    }

    const row = await query.executeTakeFirst();
    return Number(row?.count ?? 0);
  }
}
