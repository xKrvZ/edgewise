import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Rename reason column to reportReason
  await db.schema
    .alterTable('abuse_report')
    .renameColumn('reason', 'reportReason')
    .execute();

  // Drop actionTaken column (can be inferred from punishmentId)
  await db.schema
    .alterTable('abuse_report')
    .dropColumn('actionTaken')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Add actionTaken column back
  await db.schema
    .alterTable('abuse_report')
    .addColumn('actionTaken', 'varchar(50)', (col) => col)
    .execute();

  // Rename reportReason back to reason
  await db.schema
    .alterTable('abuse_report')
    .renameColumn('reportReason', 'reason')
    .execute();
}
