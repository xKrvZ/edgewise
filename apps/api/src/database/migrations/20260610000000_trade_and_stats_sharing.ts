import { Kysely, sql } from 'kysely';

/**
 * Public sharing: trade visibility + share tokens, trader profile for stats sharing.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('trade')
    .addColumn('visibility', 'text', (col) => col.notNull().defaultTo('private'))
    .addColumn('shareToken', 'text')
    .execute();

  await db.schema
    .createIndex('trade_share_token_idx')
    .on('trade')
    .column('shareToken')
    .unique()
    .execute();

  await db.schema
    .createTable('trader_profile')
    .addColumn('userId', 'text', (col) =>
      col.primaryKey().references('user.id').onDelete('cascade'),
    )
    .addColumn('displayName', 'text')
    .addColumn('bio', 'text')
    .addColumn('statsVisibility', 'text', (col) => col.notNull().defaultTo('private'))
    .addColumn('statsShareToken', 'text')
    .addColumn('createdAt', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updatedAt', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('trader_profile_stats_share_token_idx')
    .on('trader_profile')
    .column('statsShareToken')
    .unique()
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('trader_profile').execute();

  await db.schema.dropIndex('trade_share_token_idx').execute();

  await db.schema
    .alterTable('trade')
    .dropColumn('shareToken')
    .dropColumn('visibility')
    .execute();
}
