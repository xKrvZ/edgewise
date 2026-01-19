import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('player')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('externalId', 'varchar', (col) => col.notNull())
    .addColumn('lastKnownUsername', 'varchar', (col) => col.notNull())
    .addColumn('game', 'varchar', (col) => col.notNull())
    .addUniqueConstraint('player_external_id_game_unique', ['externalId', 'game'])
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updatedAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('player').execute();
}
