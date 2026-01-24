import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add foreign key constraint for punishment.relatedAbuseReportId
  await db.schema
    .alterTable('punishment')
    .addForeignKeyConstraint(
      'punishment_related_abuse_report_id_fk',
      ['relatedAbuseReportId'],
      'abuse_report',
      ['id'],
    )
    .onDelete('set null')
    .execute();

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

  // Drop foreign key constraint for punishment.relatedAbuseReportId
  await db.schema
    .alterTable('punishment')
    .dropConstraint('punishment_related_abuse_report_id_fk')
    .execute();
}
