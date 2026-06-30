import { Kysely, sql } from 'kysely';

/**
 * Community blog posts authored by mentors and owners.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('community_post')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('communityId', 'uuid', (col) =>
      col.notNull().references('community.id').onDelete('cascade'),
    )
    .addColumn('authorUserId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('publishedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_community_post_communityId_publishedAt')
    .on('community_post')
    .columns(['communityId', 'publishedAt'])
    .execute();

  await db.schema
    .createIndex('idx_community_post_authorUserId')
    .on('community_post')
    .column('authorUserId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('community_post').execute();
}
