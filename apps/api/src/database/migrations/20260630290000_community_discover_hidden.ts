import { Kysely } from 'kysely';

/**
 * Admin-controlled discover visibility for communities and posts.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('community')
    .addColumn('discoverHiddenAt', 'timestamptz')
    .execute();

  await db.schema
    .alterTable('community_post')
    .addColumn('discoverHiddenAt', 'timestamptz')
    .execute();

  await db.schema
    .createIndex('idx_community_discoverHiddenAt')
    .on('community')
    .column('discoverHiddenAt')
    .execute();

  await db.schema
    .createIndex('idx_community_post_discoverHiddenAt')
    .on('community_post')
    .column('discoverHiddenAt')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_community_post_discoverHiddenAt').execute();
  await db.schema.dropIndex('idx_community_discoverHiddenAt').execute();
  await db.schema.alterTable('community_post').dropColumn('discoverHiddenAt').execute();
  await db.schema.alterTable('community').dropColumn('discoverHiddenAt').execute();
}
