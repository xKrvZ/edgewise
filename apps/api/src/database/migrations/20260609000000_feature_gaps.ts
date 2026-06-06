import { Kysely, sql } from 'kysely';

/**
 * Feature-gap columns: account breakeven range, tag categories, trade MAE/MFE.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('trading_account')
    .addColumn('breakevenRange', 'numeric', (col) => col.notNull().defaultTo('0'))
    .execute();

  await db.schema
    .alterTable('tag')
    .addColumn('category', 'text', (col) => col.notNull().defaultTo('custom'))
    .execute();

  await db.schema
    .alterTable('trade')
    .addColumn('mae', 'numeric')
    .addColumn('mfe', 'numeric')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('trade')
    .dropColumn('mae')
    .dropColumn('mfe')
    .execute();

  await db.schema.alterTable('tag').dropColumn('category').execute();

  await db.schema.alterTable('trading_account').dropColumn('breakevenRange').execute();
}
