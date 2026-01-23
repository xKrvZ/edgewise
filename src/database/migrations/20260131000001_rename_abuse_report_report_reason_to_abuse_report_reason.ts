import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Rename the table
  await db.schema
    .alterTable('abuse_report_report_reason')
    .renameTo('abuse_report_reason')
    .execute();

  // Drop old index and recreate with new name
  await sql`
    DROP INDEX IF EXISTS abuse_report_report_reason_unique_idx;
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX abuse_report_reason_unique_idx 
    ON abuse_report_reason ("abuseReportId", "reportReason");
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop new index
  await sql`
    DROP INDEX IF EXISTS abuse_report_reason_unique_idx;
  `.execute(db);

  // Rename the table back
  await db.schema
    .alterTable('abuse_report_reason')
    .renameTo('abuse_report_report_reason')
    .execute();

  // Recreate old index
  await sql`
    CREATE UNIQUE INDEX abuse_report_report_reason_unique_idx 
    ON abuse_report_report_reason ("abuseReportId", "reportReason");
  `.execute(db);
}
