import { Kysely } from 'kysely';

/**
 * Track which community playbook template a personal playbook was cloned from.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('playbook')
    .addColumn('clonedFromCommunityTemplateId', 'uuid', (col) =>
      col.references('community_playbook_template.id').onDelete('set null'),
    )
    .execute();

  await db.schema
    .createIndex('idx_playbook_userId_clonedFromCommunityTemplateId')
    .on('playbook')
    .columns(['userId', 'clonedFromCommunityTemplateId'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_playbook_userId_clonedFromCommunityTemplateId').execute();
  await db.schema.alterTable('playbook').dropColumn('clonedFromCommunityTemplateId').execute();
}
