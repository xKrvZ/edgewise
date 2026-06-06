import { Kysely, sql } from 'kysely';

/**
 * Append-only platform events + daily rollups for admin analytics.
 * Designed for Postgres-first ops with a clean export path to a warehouse later.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('platform_event')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('source', 'text', (col) => col.notNull())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('idempotencyKey', 'text', (col) => col.notNull().unique())
    .addColumn('userId', 'text', (col) => col.references('user.id').onDelete('set null'))
    .addColumn('amountCents', sql`bigint`)
    .addColumn('currency', 'text')
    .addColumn('occurredAt', 'timestamptz', (col) => col.notNull())
    .addColumn('payload', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_platform_event_occurredAt')
    .on('platform_event')
    .column('occurredAt')
    .execute();

  await db.schema
    .createIndex('idx_platform_event_type_occurredAt')
    .on('platform_event')
    .columns(['type', 'occurredAt'])
    .execute();

  await db.schema
    .createIndex('idx_platform_event_userId')
    .on('platform_event')
    .column('userId')
    .execute();

  await db.schema
    .createTable('platform_daily_metric')
    .addColumn('metricDate', 'date', (col) => col.notNull())
    .addColumn('metric', 'text', (col) => col.notNull())
    .addColumn('value', sql`numeric(20, 4)`, (col) => col.notNull().defaultTo(0))
    .addColumn('metadata', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addPrimaryKeyConstraint('pk_platform_daily_metric', ['metricDate', 'metric'])
    .execute();

  await db.schema
    .createIndex('idx_platform_daily_metric_metric_date')
    .on('platform_daily_metric')
    .columns(['metric', 'metricDate'])
    .execute();

  await db.schema
    .createIndex('idx_user_createdAt')
    .on('user')
    .column('createdAt')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_user_createdAt').ifExists().execute();
  await db.schema.dropTable('platform_daily_metric').ifExists().execute();
  await db.schema.dropTable('platform_event').ifExists().execute();
}
