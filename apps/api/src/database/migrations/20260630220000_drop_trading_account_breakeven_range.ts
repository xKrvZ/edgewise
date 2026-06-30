import { Kysely } from 'kysely';

/**
 * Remove unused account-level breakeven range; analytics use strict zero P&L only.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('trading_account')
    .dropColumn('breakevenRange')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('trading_account')
    .addColumn('breakevenRange', 'numeric', (col) => col.notNull().defaultTo('0'))
    .execute();
}
