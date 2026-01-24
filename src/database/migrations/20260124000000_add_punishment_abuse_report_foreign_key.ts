import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add foreign key constraint for abuse_report.punishmentId
  await db.schema
    .alterTable('abuse_report')
    .addForeignKeyConstraint(
      'abuse_report_punishment_id_fk',
      ['punishmentId'],
      'punishment',
      ['id'],
    )
    .onDelete('set null')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop foreign key constraint for abuse_report.punishmentId
  await db.schema
    .alterTable('abuse_report')
    .dropConstraint('abuse_report_punishment_id_fk')
    .execute();
}
