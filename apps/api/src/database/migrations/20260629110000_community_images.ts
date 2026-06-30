import { Kysely } from 'kysely';

/**
 * Community branding: logo and header banner images stored in object storage.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('community')
    .addColumn('logoStorageKey', 'text')
    .addColumn('headerStorageKey', 'text')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('community')
    .dropColumn('headerStorageKey')
    .dropColumn('logoStorageKey')
    .execute();
}
