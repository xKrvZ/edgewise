import { Kysely } from 'kysely';

/**
 * Add full playbook flow fields to community playbook templates
 * (mirrors personal playbook: setup, risk, entry, exit, invalidation).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('community_playbook_template')
    .addColumn('marketConditions', 'text')
    .addColumn('entryCriteria', 'text')
    .addColumn('exitCriteria', 'text')
    .addColumn('riskRules', 'text')
    .addColumn('invalidationRules', 'text')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('community_playbook_template')
    .dropColumn('marketConditions')
    .dropColumn('entryCriteria')
    .dropColumn('exitCriteria')
    .dropColumn('riskRules')
    .dropColumn('invalidationRules')
    .execute();
}
