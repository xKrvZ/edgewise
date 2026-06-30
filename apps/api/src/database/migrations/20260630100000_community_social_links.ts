import { Kysely } from 'kysely';

/**
 * Community profile links: website and Discord invite URLs.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('community')
    .addColumn('websiteUrl', 'text')
    .addColumn('discordUrl', 'text')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('community')
    .dropColumn('discordUrl')
    .dropColumn('websiteUrl')
    .execute();
}
