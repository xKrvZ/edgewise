import { Kysely } from 'kysely';

/**
 * Per-screenshot visibility for trade share links.
 *
 * - `visibility`: 'private' | 'public' — only `public` media appears on
 *   GET /api/public/trades/:shareToken. Defaults to `private` (opt-in).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('screenshot')
    .addColumn('visibility', 'text', (col) => col.notNull().defaultTo('private'))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('screenshot').dropColumn('visibility').execute();
}
