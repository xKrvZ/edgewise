import { Kysely, sql } from 'kysely';

/**
 * Community social feature: communities, membership, invitations.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('community')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('createdBy', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_community_createdBy')
    .on('community')
    .column('createdBy')
    .execute();

  await db.schema
    .createTable('community_member')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('communityId', 'uuid', (col) =>
      col.notNull().references('community.id').onDelete('cascade'),
    )
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('role', 'text', (col) => col.notNull())
    .addColumn('joinedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('community_member_communityId_userId_unique')
    .on('community_member')
    .columns(['communityId', 'userId'])
    .unique()
    .execute();

  await db.schema
    .createIndex('idx_community_member_userId')
    .on('community_member')
    .column('userId')
    .execute();

  await db.schema
    .createTable('community_invitation')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('communityId', 'uuid', (col) =>
      col.notNull().references('community.id').onDelete('cascade'),
    )
    .addColumn('invitedBy', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('inviteeEmail', 'text')
    .addColumn('inviteeUserId', 'text', (col) =>
      col.references('user.id').onDelete('cascade'),
    )
    .addColumn('role', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('pending'))
    .addColumn('token', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('respondedAt', 'timestamptz')
    .execute();

  await db.schema
    .createIndex('community_invitation_token_unique')
    .on('community_invitation')
    .column('token')
    .unique()
    .execute();

  await db.schema
    .createIndex('idx_community_invitation_inviteeUserId')
    .on('community_invitation')
    .column('inviteeUserId')
    .execute();

  await db.schema
    .createIndex('idx_community_invitation_communityId')
    .on('community_invitation')
    .column('communityId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('community_invitation').execute();
  await db.schema.dropTable('community_member').execute();
  await db.schema.dropTable('community').execute();
}
