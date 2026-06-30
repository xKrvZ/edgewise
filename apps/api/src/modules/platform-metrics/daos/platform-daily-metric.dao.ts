import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type { PlatformDailyMetric } from '../constants/platform-metrics.constants';

export interface DailyMetricRow {
  metricDate: string;
  value: number;
}

@Injectable()
export class PlatformDailyMetricDao extends KyselyDao<PlatformDailyMetricDao> {
  async upsert(metricDate: string, metric: PlatformDailyMetric, value: number): Promise<void> {
    await this.kysely
      .insertInto('platform_daily_metric')
      .values({
        metricDate,
        metric,
        value,
        updatedAt: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['metricDate', 'metric']).doUpdateSet({
          value,
          updatedAt: new Date(),
        }),
      )
      .execute();
  }

  async increment(metricDate: string, metric: PlatformDailyMetric, delta: number): Promise<void> {
    await this.kysely
      .insertInto('platform_daily_metric')
      .values({
        metricDate,
        metric,
        value: delta,
        updatedAt: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['metricDate', 'metric']).doUpdateSet({
          value: sql`platform_daily_metric.value + ${delta}`,
          updatedAt: new Date(),
        }),
      )
      .execute();
  }

  async getSeries(metric: PlatformDailyMetric, since: Date): Promise<DailyMetricRow[]> {
    const rows = await this.kysely
      .selectFrom('platform_daily_metric')
      .select(['metricDate', 'value'])
      .where('metric', '=', metric)
      .where('metricDate', '>=', since)
      .orderBy('metricDate', 'asc')
      .execute();

    return rows.map((row) => ({
      metricDate:
        row.metricDate instanceof Date
          ? row.metricDate.toISOString().slice(0, 10)
          : String(row.metricDate),
      value: Number(row.value),
    }));
  }

  async hasAnySince(metric: PlatformDailyMetric, since: Date): Promise<boolean> {
    const row = await this.kysely
      .selectFrom('platform_daily_metric')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('metric', '=', metric)
      .where('metricDate', '>=', since)
      .executeTakeFirst();

    return Number(row?.count ?? 0) > 0;
  }

  async sumSince(metric: PlatformDailyMetric, since: Date): Promise<number> {
    const row = await this.kysely
      .selectFrom('platform_daily_metric')
      .select((eb) => eb.fn.sum<number>('value').as('total'))
      .where('metric', '=', metric)
      .where('metricDate', '>=', since)
      .executeTakeFirst();

    return Number(row?.total ?? 0);
  }

  async sumBetween(
    metric: PlatformDailyMetric,
    start: Date,
    end: Date,
  ): Promise<number> {
    const row = await this.kysely
      .selectFrom('platform_daily_metric')
      .select((eb) => eb.fn.sum<number>('value').as('total'))
      .where('metric', '=', metric)
      .where('metricDate', '>=', start)
      .where('metricDate', '<', end)
      .executeTakeFirst();

    return Number(row?.total ?? 0);
  }

  async getUserSignupSeriesFromUsers(since: Date): Promise<DailyMetricRow[]> {
    const rows = await this.kysely
      .selectFrom('user')
      .select([
        sql<string>`to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD')`.as('metricDate'),
        sql<number>`count(*)::int`.as('value'),
      ])
      .where('createdAt', '>=', since)
      .groupBy(sql`date_trunc('day', "createdAt")`)
      .orderBy(sql`date_trunc('day', "createdAt")`, 'asc')
      .execute();

    return rows.map((row) => ({
      metricDate: row.metricDate,
      value: Number(row.value),
    }));
  }
}
