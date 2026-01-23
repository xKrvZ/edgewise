import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create unique index if it doesn't exist (for data integrity)
  // Check if unique constraint exists, if not create it
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'punishment_reasons_unique_idx'
      ) THEN
        CREATE UNIQUE INDEX punishment_reasons_unique_idx 
        ON punishment_punishment_reason ("punishmentId", "punishmentReason");
      END IF;
    END $$;
  `.execute(db);

  // Rename the table
  await db.schema
    .alterTable('punishment_punishment_reason')
    .renameTo('punishment_reasons')
    .execute();

  // Drop old index if it exists and recreate with new name
  await sql`
    DROP INDEX IF EXISTS punishment_punishment_reason_unique_idx;
  `.execute(db);

  // The unique index will be automatically renamed with the table, but we'll ensure it exists
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'punishment_reasons_unique_idx'
      ) THEN
        CREATE UNIQUE INDEX punishment_reasons_unique_idx 
        ON punishment_reasons ("punishmentId", "punishmentReason");
      END IF;
    END $$;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop new index
  await sql`
    DROP INDEX IF EXISTS punishment_reasons_unique_idx;
  `.execute(db);

  // Rename the table back
  await db.schema
    .alterTable('punishment_reasons')
    .renameTo('punishment_punishment_reason')
    .execute();

  // Recreate old index
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS punishment_punishment_reason_unique_idx 
    ON punishment_punishment_reason ("punishmentId", "punishmentReason");
  `.execute(db);
}
