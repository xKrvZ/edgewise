import { Kysely } from 'kysely';

/**
 * GDPR account-deletion markers on the Better Auth user table.
 * Rows are anonymized in place (not hard-deleted) so billing FKs remain valid.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user')
    .addColumn('deletedAt', 'timestamptz')
    .addColumn('anonymizedAt', 'timestamptz')
    .addColumn('deletionRequestedAt', 'timestamptz')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user')
    .dropColumn('deletionRequestedAt')
    .dropColumn('anonymizedAt')
    .dropColumn('deletedAt')
    .execute();
}
