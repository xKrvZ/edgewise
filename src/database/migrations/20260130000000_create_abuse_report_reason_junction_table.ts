import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create junction table for abuse_report and report_reason
  await db.schema
    .createTable('abuse_report_report_reason')
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
    .createIndex('abuse_report_report_reason_unique_idx')
    .on('abuse_report_report_reason')
    .columns(['abuseReportId', 'reportReason'])
    .unique()
    .execute();

  // Migrate existing data from reportReason column to junction table
  await sql`
    INSERT INTO abuse_report_report_reason ("abuseReportId", "reportReason")
    SELECT id, "reportReason"
    FROM abuse_report
    WHERE "reportReason" IS NOT NULL
  `.execute(db);

  // Drop the reportReason column from abuse_report table
  await db.schema
    .alterTable('abuse_report')
    .dropColumn('reportReason')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Add reportReason column back to abuse_report table
  await db.schema
    .alterTable('abuse_report')
    .addColumn('reportReason', 'varchar', (col) => col)
    .execute();

  // Migrate data back from junction table (take first reason if multiple exist)
  await sql`
    UPDATE abuse_report
    SET "reportReason" = (
      SELECT "reportReason"
      FROM abuse_report_report_reason
      WHERE abuse_report_report_reason."abuseReportId" = abuse_report.id
      LIMIT 1
    )
  `.execute(db);

  // Drop the junction table
  await db.schema.dropTable('abuse_report_report_reason').execute();
}
