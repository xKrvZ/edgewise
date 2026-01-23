import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Rename reason column to punishmentReason
  await db.schema
    .alterTable('punishment')
    .renameColumn('reason', 'punishmentReason')
    .execute();

  // Remove banType column
  await db.schema
    .alterTable('punishment')
    .dropColumn('banType')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Add banType column back
  await db.schema
    .alterTable('punishment')
    .addColumn('banType', 'varchar')
    .execute();

  // Rename punishmentReason back to reason
  await db.schema
    .alterTable('punishment')
    .renameColumn('punishmentReason', 'reason')
    .execute();
}
