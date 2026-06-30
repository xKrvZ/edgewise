import { Kysely } from 'kysely';

/**
 * Soft delete for community blog posts.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('community_post')
    .addColumn('deletedAt', 'timestamptz')
    .execute();

  await db.schema
    .createIndex('idx_community_post_communityId_deletedAt')
    .on('community_post')
    .columns(['communityId', 'deletedAt'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_community_post_communityId_deletedAt').execute();
  await db.schema.alterTable('community_post').dropColumn('deletedAt').execute();
}
