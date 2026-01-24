import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create appeal table
  await db.schema
    .createTable('appeal')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('playerId', 'uuid', (col) =>
      col.references('player.id').onDelete('cascade').notNull(),
    )
    .addColumn('punishmentId', 'uuid', (col) =>
      col.references('punishment.id').onDelete('cascade').notNull(),
    )
    .addColumn('description', 'text')
    .addColumn('submittedAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('status', 'varchar', (col) => col.notNull())
    .addColumn('reviewedById', 'varchar', (col) =>
      col.references('user.id').onDelete('set null'),
    )
    .addColumn('reviewNoteId', 'uuid', (col) =>
      col.references('note.id').onDelete('set null'),
    )
    .addColumn('acceptanceReason', 'varchar')
    .addColumn('rejectionReason', 'varchar')
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updatedAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('appeal').execute();
}
