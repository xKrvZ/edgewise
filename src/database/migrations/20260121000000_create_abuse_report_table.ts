import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create abuse_report table
  await db.schema
    .createTable('abuse_report')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('reportingPlayerId', 'uuid', (col) =>
      col.references('player.id').onDelete('cascade').notNull(),
    )
    .addColumn('reportedPlayerId', 'uuid', (col) =>
      col.references('player.id').onDelete('cascade').notNull(),
    )
    .addColumn('description', 'text')
    .addColumn('status', 'varchar', col => col.notNull())
    .addColumn('punishmentId', 'uuid')
    .addColumn('metadata', 'jsonb')
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updatedAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // Create abuse_report_reason junction table
  await db.schema
    .createTable('abuse_report_reason')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('abuseReportId', 'uuid', (col) =>
      col.references('abuse_report.id').onDelete('cascade').notNull(),
    )
    .addColumn('reportReason', 'varchar', (col) => col.notNull())
    .execute();

  // Create unique constraint to prevent duplicate reason entries for the same report
  await db.schema
    .createIndex('abuse_report_reason_unique_idx')
    .on('abuse_report_reason')
    .columns(['abuseReportId', 'reportReason'])
    .unique()
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('abuse_report_reason').execute();
  await db.schema.dropTable('abuse_report').execute();
}
