import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create junction table for punishment reasons
  await db.schema
    .createTable('punishment_punishment_reason')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('punishmentId', 'uuid', (col) =>
      col.references('punishment.id').onDelete('cascade').notNull(),
    )
    .addColumn('punishmentReason', 'varchar', (col) => col.notNull())
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // Migrate existing data from punishment.punishmentReason to junction table
  await sql`
    INSERT INTO punishment_punishment_reason ("punishmentId", "punishmentReason", "createdAt")
    SELECT id, "punishmentReason", "createdAt"
    FROM punishment
    WHERE "punishmentReason" IS NOT NULL
  `.execute(db);

  // Remove punishmentReason column from punishment table
  await db.schema
    .alterTable('punishment')
    .dropColumn('punishmentReason')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Add punishmentReason column back to punishment table
  await db.schema
    .alterTable('punishment')
    .addColumn('punishmentReason', 'varchar')
    .execute();

  // Migrate data back (taking first reason if multiple exist)
  await sql`
    UPDATE punishment p
    SET "punishmentReason" = (
      SELECT "punishmentReason"
      FROM punishment_punishment_reason ppr
      WHERE ppr."punishmentId" = p.id
      ORDER BY ppr."createdAt" ASC
      LIMIT 1
    )
  `.execute(db);

  // Drop junction table
  await db.schema.dropTable('punishment_punishment_reason').execute();
}
