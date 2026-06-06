import { Kysely, sql } from 'kysely';

/**
 * Trader profile customization: avatar/header images, favorite symbols,
 * and optional public playbook sharing via junction table.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('trader_profile')
    .addColumn('avatarStorageKey', 'text')
    .addColumn('headerStorageKey', 'text')
    .addColumn('favoriteSymbols', sql`text[]`, (col) =>
      col.notNull().defaultTo(sql`'{}'`),
    )
    .addColumn('sharePlaybooks', 'boolean', (col) =>
      col.notNull().defaultTo(false),
    )
    .execute();

  await db.schema
    .createTable('trader_profile_playbook')
    .addColumn('userId', 'text', (col) =>
      col
        .notNull()
        .references('trader_profile.userId')
        .onDelete('cascade'),
    )
    .addColumn('playbookId', 'uuid', (col) =>
      col.notNull().references('playbook.id').onDelete('cascade'),
    )
    .addPrimaryKeyConstraint('trader_profile_playbook_pk', [
      'userId',
      'playbookId',
    ])
    .execute();

  await sql`
    UPDATE trader_profile
    SET "statsShareToken" = substr(md5(random()::text || clock_timestamp()::text), 1, 21)
    WHERE "statsShareToken" IS NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('trader_profile_playbook').execute();

  await db.schema
    .alterTable('trader_profile')
    .dropColumn('sharePlaybooks')
    .dropColumn('favoriteSymbols')
    .dropColumn('headerStorageKey')
    .dropColumn('avatarStorageKey')
    .execute();
}
