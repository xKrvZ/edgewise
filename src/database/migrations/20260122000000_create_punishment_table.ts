import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create punishment table
  await db.schema
    .createTable('punishment')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('shortCodeId', 'varchar(12)', (col) => col.notNull().unique())
    .addColumn('punishmentType', 'varchar', col => col.notNull())
    .addColumn('expiry', 'timestamp')
    .addColumn('playerId', 'uuid', col =>
      col.references('player.id').onDelete('cascade').notNull(),
    )
    .addColumn('issuedById', 'varchar', (col) =>
      col.references('user.id').onDelete('set null')
    )
    .addColumn('lifted', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('liftedById', 'varchar', (col) =>
      col.references('user.id').onDelete('set null'),
    )
    .addColumn('liftedAt', 'timestamp')
    .addColumn('liftReason', 'text')
    .addColumn('liftNoteId', 'uuid', (col) =>
      col.references('note.id').onDelete('set null'),
    )
    .addColumn('punishmentNoteId', 'uuid', (col) =>
      col.references('note.id').onDelete('set null'),
    )
    .addColumn('relatedAbuseReportId', 'uuid')
    .addColumn('appealLocked', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updatedAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // Create punishment_reasons junction table
  await db.schema
    .createTable('punishment_reasons')
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

  // Create unique constraint to prevent duplicate reason entries for the same punishment
  await db.schema
    .createIndex('punishment_reasons_unique_idx')
    .on('punishment_reasons')
    .columns(['punishmentId', 'punishmentReason'])
    .unique()
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('punishment_reasons').execute();
  await db.schema.dropTable('punishment').execute();
}
