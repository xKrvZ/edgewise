import { Kysely, sql } from 'kysely';

/**
 * Post visibility, comment settings, and post comment threads.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('community_post')
    .addColumn('visibility', 'text', (col) => col.notNull().defaultTo('private'))
    .addColumn('commentsEnabled', 'boolean', (col) => col.notNull().defaultTo(true))
    .execute();

  await db.schema
    .createTable('community_post_comment')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('postId', 'uuid', (col) =>
      col.notNull().references('community_post.id').onDelete('cascade'),
    )
    .addColumn('authorUserId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('body', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_community_post_comment_postId_createdAt')
    .on('community_post_comment')
    .columns(['postId', 'createdAt'])
    .execute();

  await db.schema
    .createIndex('idx_community_post_comment_authorUserId')
    .on('community_post_comment')
    .column('authorUserId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('community_post_comment').execute();
  await db.schema
    .alterTable('community_post')
    .dropColumn('commentsEnabled')
    .dropColumn('visibility')
    .execute();
}
