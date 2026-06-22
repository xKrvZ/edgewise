import { Kysely } from 'kysely';

/**
 * Per-user override for max trading accounts (null = use plan default).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user')
    .addColumn('maxTradingAccountsOverride', 'integer')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('user').dropColumn('maxTradingAccountsOverride').execute();
}
