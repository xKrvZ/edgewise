import { Kysely } from 'kysely';

/**
 * Adds object-storage columns to `screenshot` so trade media (images AND videos)
 * can live in S3/MinIO instead of only referencing external URLs.
 *
 * - storageKey: object key in the bucket (null for legacy external-URL rows).
 * - contentType / sizeBytes: captured at upload for display + validation.
 * - kind: 'image' | 'video'.
 * - url becomes nullable: uploaded rows are served via short-lived presigned
 *   GET URLs derived from storageKey, so no permanent url is stored.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('screenshot')
    .addColumn('storageKey', 'text')
    .addColumn('contentType', 'text')
    .addColumn('sizeBytes', 'integer')
    .addColumn('kind', 'text', (col) => col.notNull().defaultTo('image'))
    .execute();

  await db.schema
    .alterTable('screenshot')
    .alterColumn('url', (col) => col.dropNotNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('screenshot')
    .dropColumn('storageKey')
    .dropColumn('contentType')
    .dropColumn('sizeBytes')
    .dropColumn('kind')
    .execute();
  // `url` intentionally left nullable on rollback to avoid failing on rows that
  // were created as uploads (which have no external url).
}
