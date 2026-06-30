import { Kysely } from 'kysely';

/**
 * Community join policy: public (open join) or invite_only (invitation required).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('community')
    .addColumn('joinPolicy', 'text', (col) =>
      col.notNull().defaultTo('invite_only'),
    )
    .execute();

  await db.schema
    .createIndex('idx_community_joinPolicy')
    .on('community')
    .column('joinPolicy')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_community_joinPolicy').execute();
  await db.schema.alterTable('community').dropColumn('joinPolicy').execute();
}
