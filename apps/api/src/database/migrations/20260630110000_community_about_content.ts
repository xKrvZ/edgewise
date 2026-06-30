import { Kysely } from 'kysely';

/**
 * Community "Our Community" about page content.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('community').addColumn('aboutContent', 'text').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('community').dropColumn('aboutContent').execute();
}
