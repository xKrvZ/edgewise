import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { toNumber } from '@/database/utils/numeric.util';

export interface MemberTradeRow {
  userId: string;
  pnl: number;
  fees: number;
  rMultiple: number | null;
}

@Injectable()
export class CommunityStatsDao extends KyselyDao<CommunityStatsDao> {
  async findClosedTradesForUsers(
    userIds: string[],
    dateFrom: Date,
  ): Promise<MemberTradeRow[]> {
    if (userIds.length === 0) {
      return [];
    }

    const rows = await this.kysely
      .selectFrom('trade')
      .select(['userId', 'pnl', 'fees', 'rMultiple'])
      .where('userId', 'in', userIds)
      .where('status', '=', 'closed')
      .where('entryTime', '>=', dateFrom)
      .execute();

    return rows.map((row) => ({
      userId: row.userId,
      pnl: toNumber(row.pnl) ?? 0,
      fees: toNumber(row.fees) ?? 0,
      rMultiple: toNumber(row.rMultiple),
    }));
  }
}
