import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('note')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('entityId', 'varchar', (col) => col.notNull())
    .addColumn('entityType', 'varchar', (col) => col.notNull())
    .addColumn('text', 'text', (col) => col.notNull())
    .addColumn('createdById', 'varchar', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updatedAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // Create index for efficient queries by entity
  await db.schema
    .createIndex('note_entity_idx')
    .on('note')
    .columns(['entityId', 'entityType'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('note').execute();
}
