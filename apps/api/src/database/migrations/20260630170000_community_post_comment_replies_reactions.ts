import { Kysely, sql } from 'kysely';

/**
 * Nested comment replies and per-user like/dislike reactions.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('community_post_comment')
    .addColumn('parentCommentId', 'uuid', (col) =>
      col.references('community_post_comment.id').onDelete('cascade'),
    )
    .execute();

  await db.schema
    .createIndex('idx_community_post_comment_parentCommentId')
    .on('community_post_comment')
    .column('parentCommentId')
    .execute();

  await db.schema
    .createTable('community_post_comment_reaction')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('commentId', 'uuid', (col) =>
      col.notNull().references('community_post_comment.id').onDelete('cascade'),
    )
    .addColumn('userId', 'text', (col) => col.notNull().references('user.id').onDelete('cascade'))
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_community_post_comment_reaction_commentId')
    .on('community_post_comment_reaction')
    .column('commentId')
    .execute();

  await db.schema
    .createIndex('uq_community_post_comment_reaction_comment_user')
    .unique()
    .on('community_post_comment_reaction')
    .columns(['commentId', 'userId'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('community_post_comment_reaction').execute();
  await db.schema.dropIndex('idx_community_post_comment_parentCommentId').execute();
  await db.schema
    .alterTable('community_post_comment')
    .dropColumn('parentCommentId')
    .execute();
}
