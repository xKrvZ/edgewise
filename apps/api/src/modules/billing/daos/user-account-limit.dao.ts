import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';

@Injectable()
export class UserAccountLimitDao extends KyselyDao<UserAccountLimitDao> {
  async findOverride(userId: string): Promise<number | null> {
    const row = await this.kysely
      .selectFrom('user')
      .select('maxTradingAccountsOverride')
      .where('id', '=', userId)
      .executeTakeFirst();

    if (row?.maxTradingAccountsOverride == null) {
      return null;
    }

    return Number(row.maxTradingAccountsOverride);
  }

  async setOverride(userId: string, value: number | null): Promise<boolean> {
    const result = await this.kysely
      .updateTable('user')
      .set({ maxTradingAccountsOverride: value })
      .where('id', '=', userId)
      .executeTakeFirst();

    return Number(result.numUpdatedRows ?? 0) > 0;
  }
}
