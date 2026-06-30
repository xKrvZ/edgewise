import { Kysely, sql } from 'kysely';

/**
 * Community playbook templates — shareable setup templates with checklist items.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('community_playbook_template')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('communityId', 'uuid', (col) =>
      col.notNull().references('community.id').onDelete('cascade'),
    )
    .addColumn('createdByUserId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('visibility', 'text', (col) => col.notNull().defaultTo('members_only'))
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('deletedAt', 'timestamptz')
    .execute();

  await db.schema
    .createIndex('idx_community_playbook_template_communityId')
    .on('community_playbook_template')
    .column('communityId')
    .execute();

  await db.schema
    .createTable('community_playbook_template_checklist_item')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('templateId', 'uuid', (col) =>
      col.notNull().references('community_playbook_template.id').onDelete('cascade'),
    )
    .addColumn('text', 'text', (col) => col.notNull())
    .addColumn('sortOrder', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_community_playbook_template_checklist_item_templateId')
    .on('community_playbook_template_checklist_item')
    .column('templateId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('community_playbook_template_checklist_item').execute();
  await db.schema.dropTable('community_playbook_template').execute();
}
