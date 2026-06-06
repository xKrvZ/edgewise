import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import type { Json } from '@/database/types/db';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import type {
  PlatformEventSource,
  PlatformEventType,
} from '../constants/platform-metrics.constants';

export interface PlatformEventInsert {
  source: PlatformEventSource;
  type: PlatformEventType | string;
  idempotencyKey: string;
  userId?: string | null;
  actorUserId?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  occurredAt: Date;
  payload?: Record<string, unknown>;
}

export interface PlatformEventRecord {
  id: string;
  source: PlatformEventSource;
  type: string;
  idempotencyKey: string;
  userId: string | null;
  actorUserId: string | null;
  amountCents: number | null;
  currency: string | null;
  occurredAt: Date;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export interface PlatformEventListRow extends PlatformEventRecord {
  subjectEmail: string | null;
  subjectName: string | null;
  subjectDisplayName: string | null;
  actorEmail: string | null;
  actorName: string | null;
  actorDisplayName: string | null;
}

export interface DailyAggregateRow {
  metricDate: string;
  value: number;
}

@Injectable()
export class PlatformEventDao extends KyselyDao<PlatformEventDao> {
  async insertIfAbsent(input: PlatformEventInsert): Promise<PlatformEventRecord | null> {
    const row = await this.kysely
      .insertInto('platform_event')
      .values(this.toInsertValues(input))
      .onConflict((oc) => oc.column('idempotencyKey').doNothing())
      .returning(this.returningColumns())
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return this.mapRow(row);
  }

  async insertAuditEvent(input: PlatformEventInsert): Promise<PlatformEventRecord> {
    const row = await this.kysely
      .insertInto('platform_event')
      .values(this.toInsertValues(input))
      .returning(this.returningColumns())
      .executeTakeFirstOrThrow();

    return this.mapRow(row);
  }

  async listUserEvents(params: {
    userId: string;
    types?: readonly string[];
    limit: number;
    offset: number;
  }): Promise<{ items: PlatformEventListRow[]; total: number }> {
    return this.listEvents({
      userId: params.userId,
      types: params.types,
      limit: params.limit,
      offset: params.offset,
    });
  }

  async listAdminEvents(params: {
    limit: number;
    offset: number;
  }): Promise<{ items: PlatformEventListRow[]; total: number }> {
    return this.listEvents({
      source: 'admin',
      limit: params.limit,
      offset: params.offset,
    });
  }

  async listEvents(params: {
    userId?: string;
    source?: string;
    types?: readonly string[];
    limit: number;
    offset: number;
  }): Promise<{ items: PlatformEventListRow[]; total: number }> {
    let countQuery = this.kysely.selectFrom('platform_event');
    let dataQuery = this.kysely.selectFrom('platform_event');

    if (params.userId) {
      countQuery = countQuery.where('userId', '=', params.userId);
      dataQuery = dataQuery.where('userId', '=', params.userId);
    }

    if (params.source) {
      countQuery = countQuery.where('source', '=', params.source);
      dataQuery = dataQuery.where('source', '=', params.source);
    }

    if (params.types?.length) {
      countQuery = countQuery.where('type', 'in', [...params.types]);
      dataQuery = dataQuery.where('type', 'in', [...params.types]);
    }

    const [totalRow, rows] = await Promise.all([
      countQuery.select((eb) => eb.fn.countAll<number>().as('count')).executeTakeFirst(),
      dataQuery
        .leftJoin('user as subject', 'subject.id', 'platform_event.userId')
        .leftJoin('trader_profile as subject_profile', 'subject_profile.userId', 'subject.id')
        .leftJoin('user as actor', 'actor.id', 'platform_event.actorUserId')
        .leftJoin('trader_profile as actor_profile', 'actor_profile.userId', 'actor.id')
        .select([
          'platform_event.id',
          'platform_event.source',
          'platform_event.type',
          'platform_event.idempotencyKey',
          'platform_event.userId',
          'platform_event.actorUserId',
          'platform_event.amountCents',
          'platform_event.currency',
          'platform_event.occurredAt',
          'platform_event.payload',
          'platform_event.createdAt',
          'subject.email as subjectEmail',
          'subject.name as subjectName',
          'subject_profile.displayName as subjectDisplayName',
          'actor.email as actorEmail',
          'actor.name as actorName',
          'actor_profile.displayName as actorDisplayName',
        ])
        .orderBy('platform_event.occurredAt', 'desc')
        .limit(params.limit)
        .offset(params.offset)
        .execute(),
    ]);

    return {
      total: Number(totalRow?.count ?? 0),
      items: rows.map((row) => ({
        ...this.mapRow(row),
        subjectEmail: row.subjectEmail,
        subjectName: row.subjectName,
        subjectDisplayName: row.subjectDisplayName,
        actorEmail: row.actorEmail,
        actorName: row.actorName,
        actorDisplayName: row.actorDisplayName,
      })),
    };
  }

  async aggregateByDay(params: {
    type: PlatformEventType;
    since: Date;
    amountField?: boolean;
  }): Promise<DailyAggregateRow[]> {
    const valueExpr = params.amountField
      ? sql<number>`coalesce(sum("amountCents"), 0)::float8`
      : sql<number>`count(*)::int`;

    const rows = await this.kysely
      .selectFrom('platform_event')
      .select([
        sql<string>`to_char(date_trunc('day', "occurredAt"), 'YYYY-MM-DD')`.as('metricDate'),
        valueExpr.as('value'),
      ])
      .where('type', '=', params.type)
      .where('occurredAt', '>=', params.since)
      .groupBy(sql`date_trunc('day', "occurredAt")`)
      .orderBy(sql`date_trunc('day', "occurredAt")`, 'asc')
      .execute();

    return rows.map((row) => ({
      metricDate: row.metricDate,
      value: Number(row.value),
    }));
  }

  private toInsertValues(input: PlatformEventInsert) {
    return {
      source: input.source,
      type: input.type,
      idempotencyKey: input.idempotencyKey,
      userId: input.userId ?? null,
      actorUserId: input.actorUserId ?? null,
      amountCents: input.amountCents ?? null,
      currency: input.currency ?? null,
      occurredAt: input.occurredAt,
      payload: (input.payload ?? {}) as Json,
    };
  }

  private returningColumns() {
    return [
      'id',
      'source',
      'type',
      'idempotencyKey',
      'userId',
      'actorUserId',
      'amountCents',
      'currency',
      'occurredAt',
      'payload',
      'createdAt',
    ] as const;
  }

  private mapRow(row: {
    id: string;
    source: string;
    type: string;
    idempotencyKey: string;
    userId: string | null;
    actorUserId?: string | null;
    amountCents: string | number | null;
    currency: string | null;
    occurredAt: Date | string;
    payload: unknown;
    createdAt: Date | string;
  }): PlatformEventRecord {
    return {
      id: row.id,
      source: row.source as PlatformEventSource,
      type: row.type,
      idempotencyKey: row.idempotencyKey,
      userId: row.userId,
      actorUserId: row.actorUserId ?? null,
      amountCents: row.amountCents == null ? null : Number(row.amountCents),
      currency: row.currency,
      occurredAt: new Date(row.occurredAt),
      payload:
        row.payload && typeof row.payload === 'object'
          ? (row.payload as Record<string, unknown>)
          : {},
      createdAt: new Date(row.createdAt),
    };
  }
}
