import { Kysely } from 'kysely';

/**
 * Additional community profile links: Instagram, TikTok, and YouTube URLs.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('community')
    .addColumn('instagramUrl', 'text')
    .addColumn('tiktokUrl', 'text')
    .addColumn('youtubeUrl', 'text')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('community')
    .dropColumn('youtubeUrl')
    .dropColumn('tiktokUrl')
    .dropColumn('instagramUrl')
    .execute();
}
