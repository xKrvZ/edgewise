import { Kysely } from 'kysely';

/**
 * Rich blog posts: optional hero header image stored in S3.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('community_post')
    .addColumn('headerStorageKey', 'text')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('community_post').dropColumn('headerStorageKey').execute();
}
