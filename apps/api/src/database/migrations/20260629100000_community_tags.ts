import { Kysely, sql } from 'kysely';

/**
 * Community-scoped tags for labeling and filtering members.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('community_tag')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('communityId', 'uuid', (col) =>
      col.notNull().references('community.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('color', 'text')
    .addColumn('createdBy', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('community_tag_communityId_name_unique')
    .on('community_tag')
    .columns(['communityId', 'name'])
    .unique()
    .execute();

  await db.schema
    .createIndex('idx_community_tag_communityId')
    .on('community_tag')
    .column('communityId')
    .execute();

  await db.schema
    .createTable('community_member_tag')
    .addColumn('communityMemberId', 'uuid', (col) =>
      col.notNull().references('community_member.id').onDelete('cascade'),
    )
    .addColumn('tagId', 'uuid', (col) =>
      col.notNull().references('community_tag.id').onDelete('cascade'),
    )
    .addPrimaryKeyConstraint('community_member_tag_pkey', ['communityMemberId', 'tagId'])
    .execute();

  await db.schema
    .createIndex('idx_community_member_tag_tagId')
    .on('community_member_tag')
    .column('tagId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('community_member_tag').execute();
  await db.schema.dropTable('community_tag').execute();
}
