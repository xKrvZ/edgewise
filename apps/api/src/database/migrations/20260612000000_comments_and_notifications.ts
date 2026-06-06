import { Kysely, sql } from 'kysely';

/**
 * Community comments on trades/playbooks and in-app notifications.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('comment')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('authorId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('targetType', 'text', (col) => col.notNull())
    .addColumn('targetId', 'uuid', (col) => col.notNull())
    .addColumn('communityId', 'uuid', (col) =>
      col.notNull().references('community.id').onDelete('cascade'),
    )
    .addColumn('parentId', 'uuid', (col) => col.references('comment.id').onDelete('cascade'))
    .addColumn('body', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_comment_targetType_targetId')
    .on('comment')
    .columns(['targetType', 'targetId'])
    .execute();

  await db.schema
    .createIndex('idx_comment_communityId')
    .on('comment')
    .column('communityId')
    .execute();

  await db.schema
    .createIndex('idx_comment_parentId')
    .on('comment')
    .column('parentId')
    .execute();

  await db.schema
    .createTable('notification')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('actorId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('commentId', 'uuid', (col) =>
      col.notNull().references('comment.id').onDelete('cascade'),
    )
    .addColumn('targetType', 'text', (col) => col.notNull())
    .addColumn('targetId', 'uuid', (col) => col.notNull())
    .addColumn('communityId', 'uuid', (col) =>
      col.notNull().references('community.id').onDelete('cascade'),
    )
    .addColumn('read', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_notification_userId_read')
    .on('notification')
    .columns(['userId', 'read'])
    .execute();

  await db.schema
    .createIndex('idx_notification_userId_createdAt')
    .on('notification')
    .columns(['userId', 'createdAt'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('notification').execute();
  await db.schema.dropTable('comment').execute();
}
